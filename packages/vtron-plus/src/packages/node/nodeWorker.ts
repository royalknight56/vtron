import type { ScriptWorkerRequest } from './scriptWorkerThreads';
import type { Shell, System } from 'vtron';
import { startSyncExistsHost } from './syncFsBridge';
import { createVtronSyncExistsQuery } from './syncFsQuery';
import { startNodeWorkerHost } from './workerTransport';
import { getVirtualNetwork } from '../network/virtualNet';
import { startWorkerNetworkHost } from '../network/workerNetwork';
import { mkdir, writeFile, rename, stat, realpath, readFileBytes, writeFileBytes } from 'vtron';

export interface NodeWorkerOptions {
  /** URL of the trusted vtron-plus/node-worker.mjs asset served by the host. */
  workerURL: string | URL;
  /** Explicit compatibility target; it does not describe the browser host or enable native code. */
  target?: { platform: 'linux'; arch: 'x64'; nodeVersion?: '22.14.0' };
}
const installations = new WeakMap<System, NodeWorkerOptions>();
let nextProcessId = 0;
const workers = new Map<number, Worker>();

/** Opt in for one System; existing main-thread Node behavior stays unchanged otherwise. */
export function installNodeWorkerSupport(system: System, options: NodeWorkerOptions): () => void {
  if (!options?.workerURL) throw new TypeError('A Node Worker asset URL is required');
  if (options.target !== undefined && (options.target?.platform !== 'linux' || options.target?.arch !== 'x64')) throw new TypeError('Node Worker target must be { platform: linux, arch: x64 }');
  if (options.target?.nodeVersion !== undefined && options.target.nodeVersion !== '22.14.0') throw new TypeError('Node Worker target.nodeVersion must be 22.14.0');
  if (installations.has(system)) throw new Error('Node Worker support is already installed');
  const state = { workerURL: String(options.workerURL), target: options.target && { ...options.target } };
  installations.set(system, state);
  return () => { if (installations.get(system) === state) installations.delete(system); };
}

export async function executeNodeWorker(code: string, shell: Shell, output: (text: string) => void, filename: string, args: string[], execArgv: readonly string[] = []): Promise<number | undefined> {
  const options = installations.get(shell.system);
  if (!options) return undefined;
  return runNodeWorker(code, shell, output, filename, args, { ...options, execArgv: [...execArgv] });
}

async function runNodeWorker(code: string, shell: Shell, output: (text: string) => void, filename: string, args: string[], options: NodeWorkerOptions & { execArgv: readonly string[] }, thread?: { workerData: unknown; parentPort: MessagePort; onOnline: (id: number) => void; transferredPorts?: MessagePort[]; name?: string }, depth = 0): Promise<number> {
  if (!globalThis.crossOriginIsolated || typeof SharedArrayBuffer === 'undefined') throw Object.assign(new Error('Node Worker synchronous filesystem requires cross-origin isolation (COOP/COEP) and SharedArrayBuffer'), { code: 'ERR_SYNC_FS_ISOLATION_REQUIRED' });
  if (shell.executionSignal?.aborted) throw Object.assign(new Error('Script interrupted'), { name: 'AbortError', code: 'ABORT_ERR' });
  if (nextProcessId >= Number.MAX_SAFE_INTEGER) throw new RangeError('Virtual process ID limit reached');
  const processId = ++nextProcessId;
  const worker = new Worker(options.workerURL, { type: 'module', name: thread?.name ?? 'vtron-node-' + processId });
  workers.set(processId, worker);
  const channel = new MessageChannel();
  const syncChannel = new MessageChannel();
  const networkChannel = new MessageChannel();
  const host = startNodeWorkerHost(channel.port1, shell, output, {
    onOnline: () => thread?.onOnline(processId),
    startWorker: async (request: ScriptWorkerRequest, parentPort, controlPort, signal, transferredPorts) => {
      let code = 1;
      try {
        if (depth >= 4 || workers.size >= 32) throw Object.assign(new Error('Node Worker depth/count limit reached'), { code: 'ERR_WORKER_LIMIT' });
        if (signal.aborted) return;
        const source = request.eval ? request.filename : await shell.system.fs.readFile(request.filename);
        if (source === null) throw Object.assign(new Error('Worker entry does not exist: ' + request.filename), { code: 'MODULE_NOT_FOUND' });
        if (signal.aborted) return;
        const childShell = { router: shell.router, user: shell.user, env: { ...request.env }, system: shell.system, executionSignal: signal, emit() {} } as unknown as Shell;
        code = await runNodeWorker(source, childShell, output, request.eval ? '[worker eval]' : request.filename, request.argv, { ...options, execArgv: request.execArgv }, { workerData: request.workerData, parentPort, transferredPorts, name: request.name, onOnline: id => controlPort.postMessage({ type: 'online', threadId: id }) }, depth + 1);
      } catch (error) { if (!signal.aborted) controlPort.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }); }
      finally { controlPort.postMessage({ type: 'exit', code }); controlPort.close(); parentPort.close(); }
    },
  });
  host.init.processId = processId;
  host.init.execArgv = [...options.execArgv];
  const syncHost = startSyncExistsHost(syncChannel.port1, createVtronSyncExistsQuery(shell.system.fs), {
    readdir: async (path, signal) => { const info = await stat(shell.system.fs, path, signal); if (!info) throw Object.assign(new Error('Directory not found'), { code: 'ENOENT' }); if (!info.isDirectory) throw Object.assign(new Error('Not a directory'), { code: 'ENOTDIR' }); const entries = await shell.system.fs.readdir(path); return entries.map(item => { const result = { ...item } as typeof item & { content?: string; binary?: string }; delete result.content; delete result.binary; return result; }); },
    readBytes: async (path, signal) => { if (signal.aborted) throw Object.assign(new Error('Read aborted'), { code: 'ABORT_ERR' }); const info = await stat(shell.system.fs, path, signal); if (!info) return null; if (!info.isFile) throw Object.assign(new Error('Cannot read a directory'), { code: 'EISDIR' }); return readFileBytes(shell.system.fs, path); },
    writeBytes: async (path, data, flag, signal) => { if (signal.aborted) throw Object.assign(new Error('Write aborted'), { code: 'ABORT_ERR' }); await writeFileBytes(shell.system.fs, path, data, { flag }); if (signal.aborted) throw Object.assign(new Error('Write aborted after backend completion'), { code: 'ABORT_ERR' }); },
    mkdir: (path, recursive, signal) => mkdir(shell.system.fs, path, recursive, signal),
    write: (path, data, flag, signal) => writeFile(shell.system.fs, path, data, flag, signal),
    rename: (from, to, signal) => rename(shell.system.fs, from, to, signal),
    stat: (path, signal) => stat(shell.system.fs, path, signal),
    realpath: async (path, signal) => {
      const check = () => { if (signal.aborted) throw Object.assign(new Error('Metadata query aborted'), { code: 'ABORT_ERR' }); };
      check(); const result = await realpath(shell.system.fs, path); check();
      return result;
    },
  });
  const networkHost = startWorkerNetworkHost(networkChannel.port1, getVirtualNetwork(shell.system));
  let cleanup = () => {};
  try {
    return await new Promise<number>((resolve, reject) => {
      const aborted = () => reject(Object.assign(new Error('Script interrupted'), { name: 'AbortError', code: 'ABORT_ERR' }));
      const failed = (event: ErrorEvent) => {
        event.preventDefault();
        const detail = event.message || 'Check the Worker URL, JavaScript MIME type and COOP/COEP response headers';
        reject(Object.assign(new Error(`Node Worker failed to load (${options.workerURL}): ${detail}`), { code: 'ERR_NODE_WORKER_FAILED' }));
      };
      const messageError = () => reject(Object.assign(new Error('Node Worker message could not be deserialized'), { code: 'ERR_NODE_WORKER_TRANSPORT' }));
      shell.executionSignal?.addEventListener('abort', aborted, { once: true });
      worker.addEventListener('error', failed);
      worker.addEventListener('messageerror', messageError);
      cleanup = () => {
        shell.executionSignal?.removeEventListener('abort', aborted);
        worker.removeEventListener('error', failed);
        worker.removeEventListener('messageerror', messageError);
      };
      host.done.then(resolve, reject);
      networkHost.failure.catch(reject);
      try { worker.postMessage({ port: channel.port2, syncPort: syncChannel.port2, networkPort: networkChannel.port2, init: host.init, code, filename, args, target: options.target, thread: thread && { parentPort: thread.parentPort, workerData: thread.workerData, name: thread.name } }, [channel.port2, syncChannel.port2, networkChannel.port2, ...(thread ? [thread.parentPort, ...(thread.transferredPorts ?? [])] : [])]); }
      catch (error) { reject(error); }
    });
  } finally { cleanup(); networkHost.dispose(); syncHost.dispose(); host.dispose(); worker.terminate(); workers.delete(processId); }
}
