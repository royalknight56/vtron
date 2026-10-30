import * as path from 'vtron';
import type { VtronFileWithoutContent } from 'vtron';
import type { Shell } from 'vtron';
import { compileScript, formatScriptError, locateSyntaxError, scriptBody, ScriptFailure, scriptStackOffset } from './scriptDiagnostics';
import { timersPromises } from './scriptTimers';
import { createScriptUtil } from './scriptUtil';
import { createReadlineModules } from './scriptReadline';
import { createScriptIO, ScriptEmitter, scriptAbortError } from './scriptIO';
import { createScriptTasks } from './scriptTasks';
import type { ScriptModuleContext, ScriptModuleResolver } from './ScriptModule';
import { createNodeModuleLoader } from './moduleLoader';
import { scriptFileURLToPath, scriptPathToFileURL } from './scriptURL';
import { createScriptPerformance } from './scriptPerformance';
import { createScriptCrypto } from './scriptCrypto';
import { createScriptWorkerThreads, type ScriptWorkerBackend, type ScriptThread } from './scriptWorkerThreads';
import { createScriptChildProcess } from './scriptChildProcess';
import { createScriptDNS } from './scriptDNS';
import { createScriptNet, getVirtualNetwork, type VirtualNetworkBackend } from '../network/virtualNet';
import { createScriptHTTP } from '../network/virtualHTTP';
import { createScriptTTY } from './scriptTTY';
import { Buffer } from './scriptBuffer';
import { createScriptAssert } from './scriptAssert';
import { createScriptEvents, disposeScriptEvents } from './scriptEvents';
import { createScriptQuerystring } from './scriptQuerystring';
import { createScriptPath } from './scriptPath';
import { createScriptNodeCompatibility } from './scriptNodeCompatibility';
import { createScriptReadStream } from './scriptReadStream';
import { createScriptDescriptors } from './scriptDescriptors';
import { createScriptWasi } from './scriptWasi';
import { createScriptWatch } from './scriptWatch';
import type { ScriptWatchBackend } from './workerTransport';
import { realpath, mkdir, writeFile, rename, readFileBytes, writeFileBytes } from 'vtron';

type Encoding = 'utf8' | 'utf-8';
type FileOptions = { encoding?: Encoding | null; flag?: 'w' | 'a' | 'wx' };
type Callback = (error: unknown, value?: unknown) => void;
type ScriptPath = string | URL;

export interface ScriptRuntimeOptions {
  /** Actual supported Node launch arguments, separate from script argv. */
  execArgv?: readonly string[];
  /** Complete child-thread environment; do not merge shell defaults into it. */
  env?: Readonly<Record<string, string>>;
  /** Worker-side synchronous query of an absolute, normalized Vtron path. */
  existsSync?: (absolutePath: string) => boolean;
  readdirSync?: (path: string) => VtronFileWithoutContent[];
  readFileSync?: (path: string) => Uint8Array | null;
  writeBytesSync?: (path: string, bytes: Uint8Array, flag: 'w' | 'a' | 'wx') => void;
  writeFileSync?: (absolutePath: string, data: string, flag: 'w' | 'a' | 'wx') => void;
  realpathSync?: (path: string) => string;
  statSync?: (path: string) => VtronFileWithoutContent | null;
  renameSync?: (from: string, to: string) => void;
  mkdirSync?: (absolutePath: string, recursive: boolean) => string | undefined;
  /** Disallow capabilities tied to the host System and its UI thread. */
  worker?: boolean;
  watch?: ScriptWatchBackend;
  startWorker?: ScriptWorkerBackend;
  thread?: ScriptThread;
  /** ID allocated by the host for this real Worker execution, not an OS PID. */
  processId?: number;
  network?: VirtualNetworkBackend;
  /** Explicit compatibility target, not the browser host's platform or architecture. */
  target?: { platform: 'linux'; arch: 'x64'; nodeVersion?: '22.14.0' };
}

class ScriptExit extends Error {}

function fileError(code: string, operation: string, file: string) {
  return Object.assign(new Error(`${code}: ${operation} '${file}'`), { code, path: file, syscall: operation });
}

function unsupported(name: string): never {
  throw Object.assign(new Error(`${name} is not supported by the Vtron browser runtime`), { code: 'ERR_NOT_SUPPORTED' });
}

function unavailableWorkerValue(name: string) {
  const fail = () => unsupported(`${name} in a Node Worker`);
  return new Proxy(Object.create(null), {
    get: fail, set: fail, has: fail, ownKeys: fail, getOwnPropertyDescriptor: fail,
    defineProperty: fail, deleteProperty: fail, getPrototypeOf: fail, setPrototypeOf: fail,
    isExtensible: fail, preventExtensions: fail,
  });
}

function encodingOf(options?: Encoding | FileOptions | null) {
  const encoding = typeof options === 'string' ? options : options?.encoding;
  if (encoding && encoding !== 'utf8' && encoding !== 'utf-8') unsupported(`encoding ${encoding}`);
  return encoding;
}

function textOf(data: string | Uint8Array) {
  if (typeof data === 'string') return data;
  if (data instanceof Uint8Array) return new TextDecoder('utf-8', { fatal: true }).decode(data);
  throw new TypeError('File data must be a string or UTF-8 Uint8Array');
}

function fileInfo(file: VtronFileWithoutContent) {
  const mtime = new Date(file.mtime), atime = new Date(file.atime), birthtime = new Date(file.birthtime);
  return {
    ...file, ...(file.ctime === undefined ? {} : { ctime: new Date(file.ctime), ctimeMs: new Date(file.ctime).getTime() }), mode: (file.isDirectory ? 0o040000 : file.isSymlink ? 0o120000 : 0o100000) | (file.mode & 0o777), mtime, atime, birthtime, mtimeMs: mtime.getTime(), atimeMs: atime.getTime(), birthtimeMs: birthtime.getTime(),
    isFile: () => file.isFile,
    isDirectory: () => file.isDirectory,
    isSymbolicLink: () => file.isSymlink,
  };
}

export function createScriptRuntime(shell: Shell, output: (text: string) => void, filename: string, args: string[], renderError?: (error: Error) => string, options: ScriptRuntimeOptions = {}) {
  if (options.execArgv !== undefined && (!Array.isArray(options.execArgv) || options.execArgv.some(value => typeof value !== 'string'))) throw new TypeError('execArgv must contain strings');
  const execArgv = [...(options.execArgv ?? [])];
  const storage = shell.system.fs;
  let active = true;
  let reportFailure: (error: unknown) => void = () => {};
  const failure = new Promise<never>((_resolve, reject) => { reportFailure = reject; });
  void failure.catch(() => {});
  const interrupt = () => reportFailure(scriptAbortError());
  const executionSignal = shell.executionSignal;
  executionSignal?.addEventListener('abort', interrupt, { once: true });
  const tasks = createScriptTasks(reportFailure, shell.system.scriptRuntime?.fetch);
  const homeDirectory = path.resolve(shell.system._options.userLocation || '/C/Users/');
  let cwd = path.resolve(shell.router);
  const resolve = (file: ScriptPath) => {
    if (!active) throw scriptAbortError();
    if (file instanceof URL) file = scriptFileURLToPath(file);
    if (typeof file !== 'string' || file.includes('\0')) throw new TypeError('Path must be a string without null bytes');
    return path.resolve(cwd, file);
  };
  const stat = async (file: ScriptPath, operation: string) => {
    const resolved = resolve(file);
    const info = await storage.stat(resolved);
    if (!info) throw fileError('ENOENT', operation, resolved);
    return info;
  };
  let descriptors: ReturnType<typeof createScriptDescriptors> | undefined;
  const directory = async (file: ScriptPath, operation: string) => {
    const info = await stat(file, operation);
    if (!info.isDirectory) throw fileError('ENOTDIR', operation, info.path);
    return info;
  };
  const writablePath = async (file: ScriptPath, operation: string) => {
    const resolved = resolve(file);
    await directory(path.dirname(resolved), operation);
    if ((await storage.stat(resolved))?.isDirectory) throw fileError('EISDIR', operation, resolved);
    return resolved;
  };
  const statOptions = (options: { bigint?: boolean } | null | undefined, operation: string, allowBigInt = false) => {
    if (options !== undefined && options !== null && (typeof options !== 'object' || Array.isArray(options))) throw new TypeError(`${operation} options must be an object`);
    if (options?.bigint !== undefined && typeof options.bigint !== 'boolean') throw new TypeError(`${operation}.bigint must be a boolean`);
    if (options?.bigint && !allowBigInt) unsupported(`${operation} bigint metadata`);
  };
  const mkdirOptions = (options?: number | { recursive?: boolean; mode?: number }) => {
    if (options !== undefined && typeof options !== 'number' && (!options || typeof options !== 'object' || Array.isArray(options))) throw new TypeError('mkdir options must be a mode or object');
    const recursive = typeof options === 'object' ? options.recursive ?? false : false;
    if (typeof recursive !== 'boolean') throw new TypeError('mkdir.recursive must be a boolean');
    const mode = typeof options === 'number' ? options : options?.mode;
    if (mode !== undefined && mode !== 0o777) unsupported('mkdir custom permission modes');
    return recursive;
  };
  const mkdirPath = (file: ScriptPath) => {
    if (typeof file === 'string' && file.split('/').includes('..')) unsupported('mkdir parent traversal; supply a normalized path');
    return resolve(file);
  };

  const promises = {
    async realpath(file: ScriptPath, options?: string | { encoding?: string | null }) {
      if (!active) throw scriptAbortError();
      if (file instanceof URL) file = scriptFileURLToPath(file);
      if (typeof file !== 'string' || file.includes('\0')) throw new TypeError('Path must be a string without null bytes');
      if (options !== undefined && options !== null && typeof options !== 'string' && (typeof options !== 'object' || Array.isArray(options))) throw new TypeError('realpath options must be a string or object');
      const encoding = typeof options === 'string' ? options : options?.encoding;
      if (encoding && !['utf8', 'utf-8', 'buffer'].includes(encoding)) unsupported(`realpath encoding ${encoding}`);
      const result = await realpath(storage, file.startsWith('/') ? file : cwd + '/' + file);
      return encoding === 'buffer' ? Buffer.from(result) : result;
    },
    async readFile(file: ScriptPath, options?: Encoding | FileOptions | null) {
      const encoding = encodingOf(options);
      const info = await stat(file, 'readFile');
      if (!info.isFile) throw fileError('EISDIR', 'readFile', info.path);
      const value = await readFileBytes(storage, info.path);
      if (value === null) throw fileError('ENOENT', 'readFile', info.path);
      return encoding ? Buffer.from(value).toString('utf8') : Buffer.from(value);
    },
    async writeFile(file: ScriptPath, data: string | Uint8Array, options?: Encoding | FileOptions) {
      encodingOf(options);
      const flag = typeof options === 'object' ? options?.flag || 'w' : 'w';
      if (!['w', 'a', 'wx'].includes(flag)) unsupported(`write flag ${flag}`);
      if (typeof data === 'string') await writeFile(storage, resolve(file), data, flag);
      else if (data instanceof Uint8Array) await writeFileBytes(storage, resolve(file), data, { flag });
      else throw new TypeError('File data must be a string or Uint8Array');
    },
    async appendFile(file: ScriptPath, data: string | Uint8Array, options?: Encoding | FileOptions) {
      encodingOf(options);
      await promises.writeFile(file, data, { encoding: 'utf8', flag: 'a' });
    },
    async readdir(file: ScriptPath, options?: { withFileTypes?: boolean }) {
      const info = await directory(file, 'readdir');
      const files = await storage.readdir(info.path);
      return options?.withFileTypes ? files.map(fileInfo) : files.map(item => item.name);
    },
    async stat(file: ScriptPath, options?: { bigint?: boolean } | null) {
      statOptions(options, 'fs.stat');
      const info = await stat(file, 'stat');
      if (info.isSymlink) unsupported('fs.stat symbolic link target resolution; use fs.lstat for link metadata');
      return fileInfo(info);
    },
    async lstat(file: ScriptPath, options?: { bigint?: boolean } | null) {
      statOptions(options, 'fs.lstat');
      return fileInfo(await stat(file, 'lstat'));
    },
    async readlink(file: ScriptPath) {
      const info = await stat(file, 'readlink');
      if (info.isSymlink) unsupported('fs.readlink symbolic link targets');
      throw fileError('EINVAL', 'readlink', info.path);
    },
    async access(file: ScriptPath, mode = 0) {
      if (mode !== 0) unsupported('fs.access permission checks; only F_OK existence checks are available');
      if ((await stat(file, 'access')).isSymlink) unsupported('fs.access symbolic link target resolution');
    },
    async rmdir(file: ScriptPath, options?: { recursive?: boolean }) {
      if (options && Object.keys(options).length) unsupported('fs.rmdir options; use fs.rm for recursive removal');
      const info = await directory(file, 'rmdir');
      if (info.isSymlink) unsupported('fs.rmdir symbolic links');
      if (info.path === '/') throw fileError('EBUSY', 'rmdir', info.path);
      if ((await storage.readdir(info.path)).length) throw fileError('ENOTEMPTY', 'rmdir', info.path);
      await storage.rmdir(info.path);
      if (await storage.stat(info.path)) throw fileError('EPERM', 'rmdir', info.path);
    },
    async mkdir(file: ScriptPath, options?: number | { recursive?: boolean; mode?: number }) {
      return mkdir(storage, mkdirPath(file), mkdirOptions(options));
    },
    async unlink(file: ScriptPath) {
      descriptors?.assertCanMutate(resolve(file));
      const info = await stat(file, 'unlink');
      if (!info.isFile) throw fileError('EISDIR', 'unlink', info.path);
      await storage.unlink(info.path);
    },
    async rename(from: ScriptPath, to: ScriptPath) {
      descriptors?.assertCanMutate(resolve(from)); descriptors?.assertCanMutate(resolve(to));
      await rename(storage, resolve(from), resolve(to));
    },
    async rm(file: ScriptPath, options: { recursive?: boolean; force?: boolean } = {}) {
      descriptors?.assertCanMutate(resolve(file));
      if (!options || typeof options !== 'object') throw new TypeError('rm options must be an object');
      for (const key of ['recursive', 'force'] as const) {
        if (options[key] !== undefined && typeof options[key] !== 'boolean') throw new TypeError(`rm.${key} must be a boolean`);
      }
      const resolved = resolve(file);
      if (resolved === '/') throw fileError('EBUSY', 'rm', resolved);
      const remove = async (target: string): Promise<void> => {
        try {
          const info = await storage.stat(target);
          if (!info) {
            if (options.force) return;
            throw fileError('ENOENT', 'rm', target);
          }
          if (info.mode !== undefined && info.mode <= 0o111) throw fileError('EACCES', 'rm', target);
          if (info.isDirectory) {
            if (!options.recursive) throw fileError('EISDIR', 'rm', target);
            for (const child of await storage.readdir(target)) await remove(child.path);
            if ((await storage.readdir(target)).length) throw fileError('ENOTEMPTY', 'rm', target);
            await storage.rmdir(target);
          } else await storage.unlink(target);
          if (await storage.stat(target)) throw fileError('EPERM', 'rm', target);
        } catch (error) {
          const missing = error === 'File not found' || (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT');
          if (!(options.force && missing)) throw error;
        }
      };
      await remove(resolved);
    },
  };

  const trackedPromises = Object.fromEntries(Object.entries(promises).map(([name, operation]) => [name, tasks.wrap(operation)])) as typeof promises;
  const fsConstants = Object.freeze({ F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1 });
  const unavailableFS = ['copyFile', 'mkdtemp', 'open', 'close', 'read'];
  const promiseModule = Object.assign({}, trackedPromises, { constants: fsConstants }, Object.fromEntries(unavailableFS.map(name => [name, tasks.wrap(async () => unsupported(`fs.promises.${name}`))])));
  // fs/promises is the native asynchronous bridge. The fs module also supports callbacks.
  const fs: Record<string, unknown> = { promises: promiseModule, constants: fsConstants };
  const pending = new Set<Promise<unknown>>();
  const callbackErrors: unknown[] = [];
  for (const [name, operation] of Object.entries(trackedPromises)) {
    fs[name] = (...values: unknown[]) => {
      const callback = values.pop();
      if (typeof callback !== 'function') throw new TypeError(`fs.${name} requires a callback; use fs.promises.${name} with await`);
      const task = (operation as (...args: unknown[]) => Promise<unknown>)(...values).then(
        value => (callback as Callback)(null, value),
        error => (callback as Callback)(error)
      ).catch(error => { callbackErrors.push(error); }).finally(() => pending.delete(task));
      pending.add(task);
    };
    fs[name + 'Sync'] = () => unsupported(`fs.${name}Sync (Vtron storage is asynchronous)`);
  }
  for (const name of [...unavailableFS, 'exists']) {
    fs[name] = () => unsupported(`fs.${name}`);
    fs[name + 'Sync'] = () => unsupported(`fs.${name}Sync (Vtron storage is asynchronous)`);
  }
  if (options.readdirSync) fs.readdirSync = (file: ScriptPath, configuration?: { withFileTypes?: boolean }) => {
    if (configuration !== undefined && (!configuration || typeof configuration !== 'object' || Array.isArray(configuration) || Object.keys(configuration).some(key => key !== 'withFileTypes'))) unsupported('readdirSync options');
    if (configuration?.withFileTypes !== undefined && typeof configuration.withFileTypes !== 'boolean') throw new TypeError('withFileTypes must be boolean');
    const entries = options.readdirSync!(resolve(file));
    return configuration?.withFileTypes ? entries.map(fileInfo) : entries.map(item => item.name);
  };
  if (options.readFileSync) fs.readFileSync = (file: ScriptPath, configuration?: Encoding | FileOptions) => {
    const encoding = encodingOf(configuration), result = options.readFileSync!(resolve(file));
    if (result === null) throw fileError('ENOENT', 'readFile', resolve(file));
    return encoding ? Buffer.from(result).toString('utf8') : Buffer.from(result);
  };
  if (options.existsSync) fs.existsSync = (file: ScriptPath) => options.existsSync!(resolve(file));
  if (options.writeFileSync || options.writeBytesSync) fs.writeFileSync = (file: ScriptPath, data: string | Uint8Array, configuration?: Encoding | FileOptions) => {
    if (configuration !== undefined && configuration !== null && typeof configuration !== 'string' && (typeof configuration !== 'object' || Array.isArray(configuration))) throw new TypeError('writeFileSync options must be an object or encoding');
    if (configuration && typeof configuration === 'object') {
      for (const [key, value] of Object.entries(configuration)) if (value !== undefined && !['encoding', 'flag'].includes(key)) unsupported(`writeFileSync option ${key}`);
    }
    encodingOf(configuration);
    const flag = typeof configuration === 'object' ? configuration?.flag || 'w' : 'w';
    if (!['w', 'a', 'wx'].includes(flag)) unsupported(`write flag ${flag}`);
    if (options.writeBytesSync) options.writeBytesSync(resolve(file), typeof data === 'string' ? Buffer.from(data) : data, flag);
    else options.writeFileSync!(resolve(file), textOf(data), flag);
  };
  if (options.realpathSync) fs.realpathSync = (file: ScriptPath, configuration?: string | { encoding?: string | null }) => {
    if (typeof file === 'string' && file.split('/').includes('..')) unsupported('realpathSync parent traversal; supply a normalized path');
    if (configuration !== undefined && configuration !== null && typeof configuration !== 'string' && (typeof configuration !== 'object' || Array.isArray(configuration))) throw new TypeError('realpathSync options must be an object or encoding');
    const encoding = typeof configuration === 'string' ? configuration : configuration?.encoding;
    if (encoding && !['utf8', 'utf-8', 'buffer'].includes(encoding)) unsupported(`realpathSync encoding ${encoding}`);
    const result = options.realpathSync!(resolve(file));
    return encoding === 'buffer' ? Buffer.from(result) : result;
  };
  if (options.statSync) fs.statSync = (file: ScriptPath, configuration?: { bigint?: boolean; throwIfNoEntry?: boolean }) => {
    statOptions(configuration, 'statSync', !!descriptors);
    if (configuration?.throwIfNoEntry !== undefined && typeof configuration.throwIfNoEntry !== 'boolean') throw new TypeError('statSync.throwIfNoEntry must be boolean');
    if (configuration?.bigint && descriptors) { const info = options.statSync!(resolve(file)); if (!info && configuration.throwIfNoEntry === false) return undefined; return descriptors.stat(resolve(file), true); }
    const resolved = resolve(file), info = options.statSync!(resolved);
    if (!info) { if (configuration?.throwIfNoEntry === false) return undefined; throw fileError('ENOENT', 'stat', resolved); }
    return fileInfo(info);
  };
  if (options.statSync) fs.lstatSync = fs.statSync;
  if (options.statSync) fs.readlinkSync = (file: ScriptPath) => {
    const resolved = resolve(file), info = options.statSync!(resolved);
    if (!info) throw fileError('ENOENT', 'readlink', resolved);
    if (info.isSymlink) unsupported('fs.readlinkSync symbolic link targets');
    throw fileError('EINVAL', 'readlink', resolved);
  };
  if (options.renameSync) fs.renameSync = (from: ScriptPath, to: ScriptPath) => { descriptors?.assertCanMutate(resolve(from)); descriptors?.assertCanMutate(resolve(to)); options.renameSync!(resolve(from), resolve(to)); };
  if (options.mkdirSync) fs.mkdirSync = (file: ScriptPath, configuration?: number | { recursive?: boolean; mode?: number }) => options.mkdirSync!(mkdirPath(file), mkdirOptions(configuration));
  const fileWatches = createScriptWatch({ storage, resolve, backend: options.watch, track: tasks.track, reportError: reportFailure });
  fs.watch = fileWatches.watch;
  const readStreams = createScriptReadStream({ storage, resolve, track: tasks.track, reportError: reportFailure });
  fs.createReadStream = readStreams.createReadStream;
  if (options.readFileSync && options.writeBytesSync && options.statSync) {
    descriptors = createScriptDescriptors({ readFileSync: options.readFileSync, writeBytesSync: options.writeBytesSync, statSync: options.statSync }, resolve, bytes => io.stdout.write(bytes), bytes => io.stderr.write(bytes));
    Object.assign(fs, { openSync: descriptors.openSync, closeSync: descriptors.closeSync, readSync: descriptors.readSync, writeSync: descriptors.writeSync, fstatSync: descriptors.fstatSync, ftruncateSync: descriptors.ftruncateSync });
  }
  for (const name of ['watchFile', 'unwatchFile', 'createWriteStream', 'Stats', 'Dirent']) {
    fs[name] = function () { return unsupported(`fs.${name}`); };
  }
  Object.assign(fs.realpathSync as object, { native: fs.realpathSync });
  Object.assign(fs.realpath as object, { native: fs.realpath });

  const write = (chunk: string | Uint8Array) => { if (!active) return false; output(textOf(chunk).replace(/\r?\n/g, '\r\n')); return true; };
  const io = createScriptIO(write, reportFailure, shell.terminal, echo => {
    if (!process.emit('SIGINT')) { if (echo) write('^C\r\n'); shell.emit('interrupt'); }
  });
  const process = Object.assign(new ScriptEmitter(reportFailure), {
    argv: ['vtron-node', filename, ...args],
    execArgv: execArgv.slice(),
    env: { ...(options.env ?? { HOME: homeDirectory, USER: shell.user, ...(shell.terminal ? { TERM: 'xterm-256color', COLORTERM: 'truecolor' } : {}), ...shell.env }) } as Record<string, string>,
    platform: options.target?.platform ?? 'browser',
    versions: Object.freeze(Object.assign(Object.create(null), options.target?.nodeVersion ? { node: options.target.nodeVersion } : {})) as Readonly<Record<string, string | undefined>>,
    nextTick: tasks.nextTick,
    getBuiltinModule(name: string): unknown {
      if (typeof name !== 'string') throw new TypeError('getBuiltinModule requires a string');
      try {
        if (name === 'module' || name === 'node:module') return moduleResolver?.(name, filename);
        return requireBuiltin(name);
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'MODULE_NOT_FOUND') return undefined;
        throw error;
      }
    },
    exitCode: undefined as number | undefined,
    exit(code?: number) { process.exitCode = code ?? process.exitCode ?? 0; throw new ScriptExit(); },
    cwd: () => cwd,
    // Unlike Node's synchronous chdir, this must be awaited because the filesystem is async.
    async chdir(file: string) { cwd = (await directory(file, 'chdir')).path; },
    stdin: io.stdin,
    stdout: io.stdout,
    stderr: io.stderr,
  });
  // This Worker belongs to one execution. Surface detached async failures
  // through its process events/failure channel instead of silently hanging.
  const unhandled = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    if (!process.emit('unhandledRejection', event.reason, event.promise)) reportFailure(event.reason instanceof Error ? event.reason : Object.assign(new Error(`Unhandled promise rejection: ${String(event.reason)}`), { code: 'ERR_UNHANDLED_REJECTION' }));
  };
  const uncaught = (event: ErrorEvent) => {
    event.preventDefault();
    const error = event.error instanceof Error ? event.error : new Error(event.message);
    if (!process.emit('uncaughtException', error, 'uncaughtException')) reportFailure(error);
  };
  if (options.worker) { globalThis.addEventListener('unhandledrejection', unhandled); globalThis.addEventListener('error', uncaught); }
  // Do not evaluate unsupported scalar accessors when an ESM namespace enumerates exports.
  for (const name of ['execPath']) Object.defineProperty(process, name, { get: () => unsupported(`process.${name} (there is no host Node process)`) });
  Object.defineProperty(process, 'pid', { get: () => options.processId ?? unsupported('process.pid (there is no host Node process)') });
  Object.defineProperty(process, 'version', { get: () => options.target?.nodeVersion ? 'v' + options.target.nodeVersion : unsupported('process.version (there is no host Node process)') });
  Object.defineProperty(process, 'arch', { get: () => options.target?.arch ?? unsupported('process.arch (there is no host Node process)') });
  const os = {
    // Fixed Ubuntu-style kernel version for the explicitly selected Linux target.
    release: () => options.target ? '6.8.0-52-generic' : unsupported('os.release'),
    platform: () => options.target?.platform ?? 'browser',
    arch: () => options.target?.arch ?? unsupported('os.arch'),
    type: () => options.target ? 'Linux' : unsupported('os.type'),
    homedir: () => typeof process.env.HOME === 'string' ? process.env.HOME : homeDirectory,
    ...Object.fromEntries(['cpus', 'availableParallelism', 'networkInterfaces', 'tmpdir'].map(name => [name, () => unsupported(`os.${name}`)])),
  };
  const url = { URL: globalThis.URL, URLSearchParams: globalThis.URLSearchParams, fileURLToPath: scriptFileURLToPath, pathToFileURL: (file: string) => scriptPathToFileURL(file, cwd) };
  const pathModule = createScriptPath(() => cwd);
  const util = createScriptUtil(() => process.argv.slice(2), { stdout: () => process.stdout, env: () => process.env, nextTick: tasks.nextTick, track: tasks.track });
  const performanceHooks = createScriptPerformance(reportFailure);
  const workerThreads = createScriptWorkerThreads({ backend: options.startWorker, thread: options.thread, execArgv, env: () => process.env, resolve, track: tasks.track, reportError: reportFailure });
  const wasi = createScriptWasi(fs, code => process.exit(code), text => io.stdout.write(text), text => io.stderr.write(text));
  const childProcess = createScriptChildProcess();
  const dns = createScriptDNS(tasks.track, reportFailure);
  const net = createScriptNet(options.network ?? getVirtualNetwork(shell.system), { track: tasks.track, reportError: reportFailure });
  if (options.worker && !options.network) {
    // A Worker has a different in-memory network from the host System. Refuse
    // socket operations rather than reporting a server the host cannot reach.
    const unavailableNetwork = () => unsupported('Virtual network in a Node Worker');
    const UnavailableServer = new Proxy(net.module.Server, { construct: unavailableNetwork });
    const UnavailableSocket = new Proxy(net.module.Socket, { construct: unavailableNetwork });
    Object.assign(net.module, { Server: UnavailableServer, Socket: UnavailableSocket, createServer: unavailableNetwork, connect: unavailableNetwork, createConnection: unavailableNetwork });
  }
  const http = createScriptHTTP(net.module, reportFailure);
  const tty = createScriptTTY(io);
  const buffer = { Buffer };
  const assertions = createScriptAssert();
  const events = createScriptEvents({ track: tasks.track });
  const querystring = createScriptQuerystring();
  const crypto = createScriptCrypto({ track: tasks.track, reportError: reportFailure, isActive: () => active });
  const compatibility = createScriptNodeCompatibility({ track: tasks.track });
  const readline = createReadlineModules(process.stdin, process.stdout);
  const timers = {
    ...timersPromises,
    setTimeout: tasks.wrap(timersPromises.setTimeout),
    setImmediate: tasks.wrap(timersPromises.setImmediate),
    scheduler: { wait: tasks.wrap(timersPromises.scheduler.wait), yield: tasks.wrap(timersPromises.scheduler.yield) },
  };
  const callbackTimers = { setTimeout: tasks.setTimeout, setInterval: tasks.setInterval, setImmediate: tasks.setImmediate, clearTimeout: tasks.clearTimeout, clearInterval: tasks.clearInterval, clearImmediate: tasks.clearImmediate, promises: timers };
  let moduleResolver: ScriptModuleResolver | undefined;
  const requireBuiltin = (name: string): unknown => {
    switch (name) {
      case 'fs': case 'node:fs': return fs;
      case 'fs/promises': case 'node:fs/promises': return promiseModule;
      case 'process': case 'node:process': return process;
      case 'path': case 'node:path': return pathModule;
      case 'path/posix': case 'node:path/posix': return pathModule.posix;
      case 'path/win32': case 'node:path/win32': return pathModule.win32;
      case 'os': case 'node:os': return os;
      case 'url': case 'node:url': return url;
      case 'perf_hooks': case 'node:perf_hooks': return performanceHooks.module;
      case 'crypto': case 'node:crypto': return crypto;
      case 'wasi': case 'node:wasi': return wasi;
      case 'worker_threads': case 'node:worker_threads': return workerThreads.module;
      case 'child_process': case 'node:child_process': return childProcess;
      case 'dns': case 'node:dns': return dns;
      case 'dns/promises': case 'node:dns/promises': return dns.promises;
      case 'net': case 'node:net': return net.module;
      case 'http': case 'node:http': return http;
      case 'tty': case 'node:tty': return tty;
      case 'buffer': case 'node:buffer': return buffer;
      case 'assert': case 'node:assert': return assertions.assert;
      case 'assert/strict': case 'node:assert/strict': return assertions.strict;
      case 'events': case 'node:events': return events;
      case 'querystring': case 'node:querystring': return querystring;
      case 'v8': case 'node:v8': return compatibility.v8;
      case 'https': case 'node:https': return compatibility.https;
      case 'http2': case 'node:http2': return compatibility.http2;
      case 'tls': case 'node:tls': return compatibility.tls;
      case 'stream': case 'node:stream': return compatibility.stream;
      case 'stream/promises': case 'node:stream/promises': return compatibility['stream/promises'];
      case 'zlib': case 'node:zlib': return compatibility.zlib;
      case 'inspector': case 'node:inspector': return compatibility.inspector;
      case 'vm': case 'node:vm': return compatibility.vm;
      case 'timers/promises': case 'node:timers/promises': return timers;
      case 'timers': case 'node:timers': return callbackTimers;
      case 'util': case 'node:util': return util;
      case 'readline': case 'node:readline': return readline.readline;
      case 'readline/promises': case 'node:readline/promises': return readline.promises;
      default: throw Object.assign(new Error(`Cannot load '${name}': this module is not supported by the Vtron browser runtime`), { code: 'MODULE_NOT_FOUND' });
    }
  };
  const require = (name: string): unknown => {
    try { return requireBuiltin(name); }
    catch (error) {
      if (moduleResolver && error && typeof error === 'object' && 'code' in error && error.code === 'MODULE_NOT_FOUND') return moduleResolver(name, filename);
      throw error;
    }
  };
  Object.defineProperty(require, 'resolve', { value: (name: string) => {
    try { requireBuiltin(name); return name; }
    catch (error) { if (moduleResolver?.resolve) return moduleResolver.resolve(name, filename); throw error; }
  } });
  Object.defineProperty(require, 'cache', { get: () => moduleResolver?.cache || {} });
  let commonJSUsed = false;
  const exports = new Proxy({} as Record<string, unknown>, {
    get(target, key, receiver) { commonJSUsed = true; return Reflect.get(target, key, receiver); },
    set(target, key, value, receiver) { commonJSUsed = true; return Reflect.set(target, key, value, receiver); },
    ownKeys(target) { commonJSUsed = true; return Reflect.ownKeys(target); },
  });
  const moduleState = { id: '.', filename, path: path.dirname(filename), exports: exports as unknown, loaded: false, parent: null, children: [], require };
  const module = new Proxy(moduleState, {
    get(target, key, receiver) { commonJSUsed = true; return Reflect.get(target, key, receiver); },
    set(target, key, value, receiver) { commonJSUsed = true; return Reflect.set(target, key, value, receiver); },
  });
  Object.defineProperty(require, 'main', { configurable: true, get: () => { commonJSUsed = true; return module; } });
  const runMain = (main: (...args: unknown[]) => unknown, system: unknown, vue: unknown) => {
    if (!commonJSUsed) {
      if (options.worker) return unsupported('Legacy main(system, vue) in a Node Worker');
      return main(system, vue);
    }
  };
  const scriptConsole = Object.create(console) as Console;
  const log = (...values: unknown[]) => write(values.map(value => {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return renderError ? renderError(value) : value.stack || `${value.name}: ${value.message}`;
    try { return JSON.stringify(value) ?? String(value); } catch { return String(value); }
  }).join(' ') + '\n');
  Object.assign(scriptConsole, { log, info: log, warn: log, error: log, debug: log });
  const settle = async () => {
    do {
      while (pending.size) await Promise.all([...pending]);
      if (callbackErrors.length) throw callbackErrors[0];
      await tasks.settle();
      await readline.settle();
      await io.settle();
      // Let detached entry-point continuations start their next I/O before declaring idle.
      await new Promise<void>(resolve => globalThis.setTimeout(resolve, 0));
      // Rejection events are queued after the microtask checkpoint, which can
      // put them behind the first timer. Keep the execution's error handlers
      // installed through the following task instead of disposing immediately.
      await new Promise<void>(resolve => globalThis.setTimeout(resolve, 0));
    } while (tasks.isActive() || io.isActive() || readline.isActive() || pending.size);
  };
  const dispose = () => {
    active = false;
    if (options.worker) { globalThis.removeEventListener('unhandledrejection', unhandled); globalThis.removeEventListener('error', uncaught); }
    executionSignal?.removeEventListener('abort', interrupt);
    disposeScriptEvents(events); fileWatches.dispose(); readStreams.dispose(); descriptors?.dispose(); workerThreads.dispose(); net.dispose(); tasks.dispose(); readline.dispose(); performanceHooks.dispose(); io.dispose(); process.removeAllListeners();
  };
  const injected = { Buffer, MessageChannel: workerThreads.module.MessageChannel, MessagePort: workerThreads.module.MessagePort, fs, process, console: scriptConsole, fetch: tasks.fetch, setTimeout: tasks.setTimeout, setInterval: tasks.setInterval, setImmediate: tasks.setImmediate, clearTimeout: tasks.clearTimeout, clearInterval: tasks.clearInterval, clearImmediate: tasks.clearImmediate };
  // Packages share Node-style globals within this execution. Writes stay off the host page.
  const globalValues: Record<string, unknown> = Object.assign(Object.create(null), injected);
  // Web platform operations require the real global receiver. A with binding
  // otherwise calls them with the execution proxy, which fails WebIDL checks.
  const hostMethods = new Set<PropertyKey>(['queueMicrotask', 'structuredClone', 'atob', 'btoa', 'postMessage', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'importScripts', 'reportError']);
  const boundHostMethods = new Map<PropertyKey, { original: Function; bound: Function }>();
  const scriptGlobal = new Proxy(globalValues, {
    get(target, key, receiver) {
      if (Reflect.has(target, key)) return Reflect.get(target, key, receiver);
      const value = Reflect.get(globalThis, key, globalThis);
      if (!hostMethods.has(key) || typeof value !== 'function') return value;
      let cached = boundHostMethods.get(key);
      if (cached?.original !== value) { cached = { original: value, bound: value.bind(globalThis) }; boundHostMethods.set(key, cached); }
      return cached!.bound;
    },
    has: (target, key) => Reflect.has(target, key) || Reflect.has(globalThis, key),
  });
  Object.assign(globalValues, { global: scriptGlobal, globalThis: scriptGlobal });
  const globals = { ...injected, global: scriptGlobal } as ScriptModuleContext['globals'];
  return { fs, process, require, requireBuiltin, globals, module, exports, runMain, tasks, setModuleResolver: (resolver?: ScriptModuleResolver) => { moduleResolver = resolver; }, markLoaded: () => { moduleState.loaded = true; }, console: scriptConsole, settle, failure, dispose };
}

export async function executeScript(code: string, shell: Shell, output: (text: string) => void, filename: string, args: string[], vue: unknown, options: ScriptRuntimeOptions = {}) {
  const offset = await scriptStackOffset();
  if (shell.executionSignal?.aborted) throw new ScriptFailure(formatScriptError(scriptAbortError(), code, filename, offset), scriptAbortError());
  const runtime = createScriptRuntime(shell, output, filename, args, error => formatScriptError(error, code, filename, offset), options);
  let resolver: ScriptModuleResolver | undefined;
  let finished = false;
  try {
    await Promise.race([(async () => {
      const prepared = await createNodeModuleLoader(shell.system)({ filename, source: code, cwd: shell.router, requireBuiltin: runtime.requireBuiltin, main: runtime.module, globals: runtime.globals, signal: shell.executionSignal, track: runtime.tasks.track });
      if (finished || shell.executionSignal?.aborted) { prepared?.dispose?.(); throw scriptAbortError(); }
      resolver = prepared;
      runtime.setModuleResolver(resolver);
      if (!(await resolver?.executeEntry?.(code))) {
        const source = resolver?.transformEntry?.(code) ?? code;
        const body = scriptBody(source, filename);
        let run: ReturnType<typeof compileScript>;
        try { run = compileScript(body, runtime.globals.global); }
        catch (error) {
          const position = error instanceof SyntaxError ? await locateSyntaxError(body, code) : undefined;
          throw new ScriptFailure(formatScriptError(error, code, filename, offset, position), error);
        }
        const importModule = (request: string, options?: unknown) => {
          if (!resolver?.importModule) throw new Error('This runtime does not provide a virtual module importer');
          return resolver.importModule(request, filename, options);
        };
        const scriptSystem = options.worker ? unavailableWorkerValue('system') : shell.system;
        const scriptVue = options.worker ? unavailableWorkerValue('vue') : vue;
        await run.call(runtime.exports, scriptSystem, scriptVue, runtime.fs, runtime.process, runtime.require, runtime.console, filename, path.dirname(filename), runtime.module, runtime.exports, runtime.runMain, runtime.tasks.fetch, runtime.tasks.setTimeout, runtime.tasks.setInterval, runtime.tasks.clearTimeout, runtime.tasks.clearInterval, importModule, runtime.globals.global, runtime.globals.global, runtime.globals.Buffer);
      }
      runtime.markLoaded();
      await runtime.settle();
    })(), runtime.failure]);
  } catch (error) {
    if (error instanceof ScriptFailure) throw error;
    if (!(error instanceof ScriptExit)) throw new ScriptFailure(formatScriptError(error, code, filename, offset), error);
  } finally { finished = true; try { resolver?.dispose?.(); } finally { runtime.dispose(); } }
  const exitCode = Number(runtime.process.exitCode ?? 0);
  return Number.isInteger(exitCode) ? exitCode & 255 : 1;
}

