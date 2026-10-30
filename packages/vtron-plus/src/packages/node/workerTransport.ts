import type { ScriptWorkerRequest, ScriptWorkerBackend } from './scriptWorkerThreads';
import type { Shell, ShellTerminal, VtronFileInterface } from 'vtron';
import { readFileBytes, writeFileBytes, watch as watchStorage, type VtronWatchEvent } from 'vtron';

export interface ScriptWatchSubscription { ready: Promise<void>; close(): void }
export type ScriptWatchBackend = (path: string, recursive: boolean, onEvent: (event: VtronWatchEvent) => void, onError: (error: unknown) => void) => ScriptWatchSubscription;

/** Structured-cloneable context for one Node execution. */
export interface NodeWorkerInit {
  processId?: number;
  execArgv?: string[];
  router: string;
  user: string;
  env: Record<string, string>;
  homeDirectory?: string;
  nativeFetch: boolean;
  terminal?: { columns: number; rows: number };
  aborted: boolean;
}

type FsMethod = 'readBinaryFile' | 'writeBinaryFile' | 'stat' | 'readFile' | 'writeFile' | 'appendFile' | 'readdir' | 'exists' | 'unlink' | 'rename' | 'rm' | 'rmdir' | 'mkdir' | 'copyFile' | 'chmod' | 'search';
const fsMethods: readonly FsMethod[] = ['readBinaryFile', 'writeBinaryFile', 'stat', 'readFile', 'writeFile', 'appendFile', 'readdir', 'exists', 'unlink', 'rename', 'rm', 'rmdir', 'mkdir', 'copyFile', 'chmod', 'search'];
type Failure = { name: string; message: string; code?: string; path?: string; syscall?: string; stack?: string; diagnostic?: string };
type Message =
  | { type: 'online' }
  | { type: 'worker-start'; id: number; request: ScriptWorkerRequest; parentPort: MessagePort; controlPort: MessagePort }
  | { type: 'worker-stop'; id: number }
  | { type: 'fs'; id: number; method: FsMethod; args: unknown[] }
  | { type: 'fs-result'; id: number; value?: unknown; error?: Failure }
  | { type: 'output'; text: string }
  | { type: 'input'; data: string }
  | { type: 'resize'; columns: number; rows: number }
  | { type: 'abort' }
  | { type: 'interrupt' }
  | { type: 'done'; exitCode?: number; error?: Failure }
  | { type: 'watch-start'; id: number; path: string; recursive: boolean; control: SharedArrayBuffer }
  | { type: 'watch-ready'; id: number; error?: Failure }
  | { type: 'watch-event'; id: number; event: VtronWatchEvent }
  | { type: 'watch-error'; id: number; error: Failure }
  | { type: 'watch-stop'; id: number }
  | { type: 'close' };

function serializeError(error: unknown): Failure {
  if (!error || typeof error !== 'object') return { name: 'Error', message: String(error) };
  const value = error as Record<string, unknown>;
  const result: Failure = { name: typeof value.name === 'string' ? value.name : 'Error', message: typeof value.message === 'string' ? value.message : String(error) };
  for (const key of ['code', 'path', 'syscall', 'stack', 'diagnostic'] as const) if (typeof value[key] === 'string') result[key] = value[key] as string;
  return result;
}
function restoreError(value: Failure): Error {
  return Object.assign(new Error(value.message), value);
}
function closedError() { return Object.assign(new Error('Node Worker transport is closed'), { code: 'ERR_NODE_WORKER_CLOSED' }); }

/** Bind a Worker to the owning desktop, forwarding each FS call to the real backend. */
export function startNodeWorkerHost(port: MessagePort, shell: Shell, output: (text: string) => void, options: { onOnline?: () => void; startWorker?: (request: ScriptWorkerRequest, parentPort: MessagePort, controlPort: MessagePort, signal: AbortSignal, transferredPorts: MessagePort[]) => Promise<void> } = {}) {
  let closed = false;
  let completed = false;
  const signal = shell.executionSignal;
  const watches = new Map<number, AbortController>();
  const children = new Map<number, AbortController>();
  const watchControls = new Map<number, (error?: unknown) => void>();
  let resolveDone!: (exitCode: number) => void;
  let rejectDone!: (error: unknown) => void;
  const done = new Promise<number>((resolve, reject) => { resolveDone = resolve; rejectDone = reject; });
  // The owner may attach its handler after setting up the Worker.
  void done.catch(() => {});
  const send = (message: Message) => { if (!closed) port.postMessage(message); };
  const onMessage = (event: MessageEvent<Message>) => {
    const message = event.data;
    if (!message || typeof message !== 'object') return;
    if (message.type === 'online') { options.onOnline?.(); return; }
    if (message.type === 'worker-stop') { children.get(message.id)?.abort(); return; }
    if (message.type === 'worker-start') {
      if (!(message.parentPort instanceof MessagePort) || !(message.controlPort instanceof MessagePort)) return;
      const control = message.controlPort;
      if (!options.startWorker || !Number.isSafeInteger(message.id) || children.has(message.id) || children.size >= 16 || !message.request || typeof message.request.filename !== 'string' || typeof message.request.eval !== 'boolean' || !Array.isArray(message.request.argv) || message.request.argv.some(value => typeof value !== 'string') || !Array.isArray(message.request.execArgv) || message.request.execArgv.some(value => typeof value !== 'string') || !message.request.env || typeof message.request.env !== 'object' || Array.isArray(message.request.env) || Object.values(message.request.env).some(value => typeof value !== 'string')) {
        control.postMessage({ type: 'error', message: 'Invalid or unsupported child Worker request', code: 'ERR_WORKER_INIT_FAILED' }); control.postMessage({ type: 'exit', code: 1 }); control.close(); message.parentPort.close(); return;
      }
      const controller = new AbortController(); children.set(message.id, controller);
      if (closed || signal?.aborted) controller.abort();
      void options.startWorker(message.request, message.parentPort, control, controller.signal, event.ports.filter(value => value !== message.parentPort && value !== message.controlPort)).catch(error => { try { control.postMessage({ type: 'error', ...serializeError(error) }); control.postMessage({ type: 'exit', code: 1 }); } finally { control.close(); message.parentPort.close(); } }).finally(() => children.delete(message.id));
      return;
    }
    if (message.type === 'output') { output(message.text); return; }
    if (message.type === 'interrupt') { shell.emit('interrupt'); return; }
    if (message.type === 'done') {
      if (completed) return;
      completed = true;
      if (message.error) rejectDone(restoreError(message.error));
      else if (typeof message.exitCode === 'number' && Number.isInteger(message.exitCode)) resolveDone(message.exitCode);
      else rejectDone(Object.assign(new Error('Invalid Node Worker completion message'), { code: 'ERR_NODE_WORKER_PROTOCOL' }));
      return;
    }
    if (message.type === 'watch-stop') { watchControls.get(message.id)?.(closedError()); watches.get(message.id)?.abort(); watches.delete(message.id); return; }
    if (message.type === 'watch-start') {
      if (!(message.control instanceof SharedArrayBuffer) || message.control.byteLength !== 8200) return;
      const control = new Int32Array(message.control, 0, 2);
      const acknowledge = (error?: unknown) => {
        watchControls.delete(message.id);
        if (Atomics.load(control, 0) !== 0) return;
        if (error !== undefined) {
          const failure = serializeError(error);
          const bytes = new TextEncoder().encode(JSON.stringify({ name: failure.name.slice(0, 128), code: failure.code?.slice(0, 128), message: failure.message.slice(0, 1000) }));
          new Uint8Array(message.control, 8).set(bytes); Atomics.store(control, 1, bytes.length);
        }
        if (Atomics.compareExchange(control, 0, 0, error === undefined ? 1 : 2) === 0) Atomics.notify(control, 0);
      };

      if (!Number.isSafeInteger(message.id) || message.id < 1 || watches.has(message.id) || typeof message.path !== 'string' || typeof message.recursive !== 'boolean') { acknowledge(new Error('Invalid watch request')); return; }
      if (signal?.aborted) { acknowledge(closedError()); return; }
      const controller = new AbortController(); watches.set(message.id, controller);
      watchControls.set(message.id, acknowledge);
      void watchStorage(shell.system.fs, message.path,
        event => { if (!closed && watches.get(message.id) === controller) send({ type: 'watch-event', id: message.id, event }); },
        error => { if (!closed && watches.get(message.id) === controller) { watches.delete(message.id); send({ type: 'watch-error', id: message.id, error: serializeError(error) }); } },
        { recursive: message.recursive, signal: controller.signal }).then(handle => {
          if (closed || watches.get(message.id) !== controller) { handle.close(); acknowledge(closedError()); return; }
          send({ type: 'watch-ready', id: message.id }); acknowledge();
        }, error => {
          if (!closed && watches.get(message.id) === controller) { watches.delete(message.id); acknowledge(error); }
        });
      return;
    }
    if (message.type !== 'fs' || !Number.isSafeInteger(message.id) || !fsMethods.includes(message.method) || !Array.isArray(message.args)) return;
    const method = shell.system.fs[message.method] as (...args: any[]) => Promise<unknown>;
    void Promise.resolve().then(() => {
      if (closed || signal?.aborted) throw Object.assign(new Error('Script interrupted'), { name: 'AbortError', code: 'ABORT_ERR' });
      if (message.method === 'readBinaryFile') return readFileBytes(shell.system.fs, message.args[0] as string);
      if (message.method === 'writeBinaryFile') return writeFileBytes(shell.system.fs, message.args[0] as string, message.args[1] as Uint8Array, message.args[2] as { flag?: 'w' | 'a' | 'wx' });
      return method.apply(shell.system.fs, message.args);
    }).then(
      value => send({ type: 'fs-result', id: message.id, value }),
      error => send({ type: 'fs-result', id: message.id, error: serializeError(error) }),
    ).catch(error => {
      // A backend result may itself be uncloneable. Report that instead of hanging.
      try { send({ type: 'fs-result', id: message.id, error: serializeError(error) }); } catch { dispose(); }
    });
  };
  const onAbort = () => send({ type: 'abort' });
  port.addEventListener('message', onMessage);
  port.start();
  const removeInput = shell.terminal?.onData(data => send({ type: 'input', data }));
  const removeResize = shell.terminal?.onResize?.((columns, rows) => send({ type: 'resize', columns, rows }));
  signal?.addEventListener('abort', onAbort, { once: true });
  const init: NodeWorkerInit = {
    router: shell.router,
    user: shell.user,
    env: { ...shell.env },
    homeDirectory: shell.system._options.userLocation,
    nativeFetch: !shell.system._options.scriptRuntime?.fetch,
    terminal: shell.terminal ? { columns: shell.terminal.columns, rows: shell.terminal.rows } : undefined,
    aborted: !!signal?.aborted,
  };
  function dispose() {
    if (closed) return;
    try { send({ type: 'close' }); } catch { /* already disconnected */ }
    closed = true;
    for (const acknowledge of watchControls.values()) acknowledge(closedError()); watchControls.clear();
    for (const controller of watches.values()) controller.abort(); watches.clear();
    for (const controller of children.values()) controller.abort(); children.clear();
    if (!completed) { completed = true; rejectDone(closedError()); }
    removeInput?.(); removeResize?.();
    signal?.removeEventListener('abort', onAbort);
    port.removeEventListener('message', onMessage);
    port.close();
  }
  return { init, done, dispose };
}

/** Worker-side proxy: all supported operations are sent to the real desktop FS. */
export function createNodeWorkerContext(port: MessagePort, init: NodeWorkerInit) {
  let closed = false;
  let finished = false;
  let nextId = 0;
  const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: unknown) => void }>();
  const controller = new AbortController();
  const watches = new Map<number, { resolve: () => void; reject: (error: unknown) => void; event: (event: VtronWatchEvent) => void; error: (error: unknown) => void }>();
  const inputListeners = new Set<(data: string) => void>();
  const initialInput: string[] = [];
  let inputReady = false;
  const resizeListeners = new Set<(columns: number, rows: number) => void>();
  const terminal: ShellTerminal | undefined = init.terminal && {
    ...init.terminal,
    onData(listener) {
      inputListeners.add(listener);
      if (!inputReady) {
        inputReady = true;
        // Defer until createScriptIO and process have both finished initializing.
        queueMicrotask(() => {
          if (closed) return;
          for (const data of initialInput.splice(0)) for (const receiver of inputListeners) receiver(data);
        });
      }
      return () => { inputListeners.delete(listener); };
    },
    onResize(listener) { resizeListeners.add(listener); return () => { resizeListeners.delete(listener); }; },
  };
  const send = (message: Message, transfer: Transferable[] = []) => {
    if (closed) throw closedError();
    port.postMessage(message, transfer);
  };
  const onMessage = (event: MessageEvent<Message>) => {
    const message = event.data;
    if (!message || typeof message !== 'object') return;
    if (message.type === 'watch-ready') {
      const watch = watches.get(message.id);
      if (watch) { if (message.error) { watches.delete(message.id); watch.reject(restoreError(message.error)); } else watch.resolve(); }
    } else if (message.type === 'watch-event') watches.get(message.id)?.event(message.event);
    else if (message.type === 'watch-error') {
      const watch = watches.get(message.id); watches.delete(message.id); watch?.error(restoreError(message.error));
    } else if (message.type === 'fs-result') {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      if (message.error) request.reject(restoreError(message.error)); else request.resolve(message.value);
    } else if (message.type === 'input') {
      if (!inputReady) initialInput.push(message.data);
      else for (const listener of inputListeners) listener(message.data);
    } else if (message.type === 'resize') {
      if (terminal) { terminal.columns = message.columns; terminal.rows = message.rows; }
      for (const listener of resizeListeners) listener(message.columns, message.rows);
    } else if (message.type === 'abort') controller.abort();
    else if (message.type === 'close') dispose();
  };
  port.addEventListener('message', onMessage);
  port.start();
  if (init.aborted) controller.abort();
  const fs = Object.fromEntries(fsMethods.map(method => [method, (...args: unknown[]) => new Promise((resolve, reject) => {
    if (closed) { reject(closedError()); return; }
    if (nextId >= Number.MAX_SAFE_INTEGER) { reject(new Error('Node Worker filesystem request ID limit reached')); return; }
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    try { send({ type: 'fs', id, method, args }); } catch (error) { pending.delete(id); reject(error); }
  })])) as unknown as VtronFileInterface;
  const workerFetch: typeof fetch = init.nativeFetch
    ? (...args) => globalThis.fetch(...args)
    : () => Promise.reject(Object.assign(new Error('Configured host fetch is unavailable in Node Worker mode'), { code: 'ERR_NOT_SUPPORTED' }));
  const shell = {
    router: init.router, user: init.user, env: { ...init.env }, terminal,
    executionSignal: controller.signal,
    system: { fs, _options: { userLocation: init.homeDirectory }, scriptRuntime: { fetch: workerFetch } },
    emit(event: string) { if (event === 'interrupt') send({ type: 'interrupt' }); },
  } as unknown as Shell;
  function dispose() {
    if (closed) return;
    closed = true;
    controller.abort();
    for (const request of pending.values()) request.reject(closedError());
    for (const watch of watches.values()) { watch.reject(closedError()); watch.error(closedError()); } watches.clear();
    pending.clear(); initialInput.length = 0; inputListeners.clear(); resizeListeners.clear();
    port.removeEventListener('message', onMessage);
    port.close();
  }
  const finish = (result: { exitCode: number } | { error: unknown }) => {
    if (finished) throw Object.assign(new Error('Node Worker has already completed'), { code: 'ERR_NODE_WORKER_PROTOCOL' });
    const message: Message = 'error' in result ? { type: 'done', error: serializeError(result.error) } : { type: 'done', exitCode: result.exitCode };
    send(message);
    finished = true;
  };
  const watch: ScriptWatchBackend = (path, recursive, onEvent, onError) => {
    if (closed) throw closedError();
    const id = ++nextId;
    let rejectReady!: (error: unknown) => void;
    const ready = new Promise<void>((resolve, reject) => { rejectReady = reject; watches.set(id, { resolve, reject, event: onEvent, error: onError }); });
    void ready.catch(() => {});
    const buffer = new SharedArrayBuffer(8200), control = new Int32Array(buffer, 0, 2);
    try {
      send({ type: 'watch-start', id, path, recursive, control: buffer });
      Atomics.wait(control, 0, 0, 10000);
      const status = Atomics.load(control, 0);
      if (status === 0 && Atomics.compareExchange(control, 0, 0, 3) === 0) throw Object.assign(new Error('Watch registration timed out'), { code: 'ERR_FS_WATCH_TIMEOUT' });
      if (Atomics.load(control, 0) === 2) {
        const length = Atomics.load(control, 1);
        if (length < 0 || length > 8192) throw new Error('Invalid watch registration error');
        throw restoreError(JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 8, length).slice())));
      }
      if (Atomics.load(control, 0) !== 1) throw closedError();
    } catch (error) { watches.delete(id); rejectReady(error); if (!closed) send({ type: 'watch-stop', id }); throw error; }
    let stopped = false;
    return { ready, close() { if (stopped) return; stopped = true; watches.delete(id); rejectReady(closedError()); if (!closed) send({ type: 'watch-stop', id }); } };
  };
  const startWorker: ScriptWorkerBackend = (request, parentPort, controlPort, transfer) => {
    if (nextId >= Number.MAX_SAFE_INTEGER) throw new RangeError('Worker request ID limit reached');
    const id = ++nextId;
    send({ type: 'worker-start', id, request, parentPort, controlPort }, [parentPort, controlPort, ...transfer]);
    return { terminate() { if (!closed) send({ type: 'worker-stop', id }); } };
  };
  return { shell, watch, startWorker, online() { send({ type: 'online' }); }, output: (text: string) => { if (finished) throw closedError(); send({ type: 'output', text }); }, finish, dispose };
}
