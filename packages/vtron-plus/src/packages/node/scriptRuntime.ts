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
import { createScriptWorkerThreads } from './scriptWorkerThreads';
import { createScriptChildProcess } from './scriptChildProcess';
import { createScriptDNS } from './scriptDNS';
import { createScriptNet, getVirtualNetwork } from '../network/virtualNet';
import { createScriptHTTP } from '../network/virtualHTTP';
import { createScriptTTY } from './scriptTTY';
import { Buffer } from 'buffer/';
import { createScriptAssert } from './scriptAssert';
import { createScriptEvents, disposeScriptEvents } from './scriptEvents';
import { createScriptQuerystring } from './scriptQuerystring';
import { createScriptPath } from './scriptPath';
import { createScriptNodeCompatibility } from './scriptNodeCompatibility';

type Encoding = 'utf8' | 'utf-8';
type FileOptions = { encoding?: Encoding | null; flag?: 'w' | 'a' | 'wx' };
type Callback = (error: unknown, value?: unknown) => void;
type ScriptPath = string | URL;

class ScriptExit extends Error {}

function fileError(code: string, operation: string, file: string) {
  return Object.assign(new Error(`${code}: ${operation} '${file}'`), { code, path: file, syscall: operation });
}

function unsupported(name: string): never {
  throw Object.assign(new Error(`${name} is not supported by the Vtron browser runtime`), { code: 'ERR_NOT_SUPPORTED' });
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
  return {
    ...file,
    isFile: () => file.isFile,
    isDirectory: () => file.isDirectory,
    isSymbolicLink: () => file.isSymlink,
  };
}

export function createScriptRuntime(shell: Shell, output: (text: string) => void, filename: string, args: string[], renderError?: (error: Error) => string) {
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

  const promises = {
    async readFile(file: ScriptPath, options?: Encoding | FileOptions | null) {
      const encoding = encodingOf(options);
      const info = await stat(file, 'readFile');
      if (!info.isFile) throw fileError('EISDIR', 'readFile', info.path);
      const value = await storage.readFile(info.path);
      if (value === null) throw fileError('ENOENT', 'readFile', info.path);
      return encoding ? value : new TextEncoder().encode(value);
    },
    async writeFile(file: ScriptPath, data: string | Uint8Array, options?: Encoding | FileOptions) {
      encodingOf(options);
      const flag = typeof options === 'object' ? options.flag || 'w' : 'w';
      if (!['w', 'a', 'wx'].includes(flag)) unsupported(`write flag ${flag}`);
      const resolved = await writablePath(file, 'writeFile');
      if (flag === 'wx' && await storage.stat(resolved)) throw fileError('EEXIST', 'writeFile', resolved);
      await storage.writeFile(resolved, textOf(data), { flag });
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
    async stat(file: ScriptPath) { return fileInfo(await stat(file, 'stat')); },
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
    async mkdir(file: ScriptPath, options?: { recursive?: boolean }) {
      const resolved = resolve(file);
      let firstCreated: string | undefined;
      const create = async (target: string): Promise<void> => {
        const existing = await storage.stat(target);
        if (existing) {
          if (!options?.recursive || !existing.isDirectory) throw fileError('EEXIST', 'mkdir', target);
          return;
        }
        const parent = path.dirname(target);
        if (parent === target) throw fileError('ENOENT', 'mkdir', target);
        if (options?.recursive) await create(parent);
        else await directory(parent, 'mkdir');
        await storage.mkdir(target);
        firstCreated ??= target;
      };
      await create(resolved);
      return options?.recursive ? firstCreated : undefined;
    },
    async unlink(file: ScriptPath) {
      const info = await stat(file, 'unlink');
      if (!info.isFile) throw fileError('EISDIR', 'unlink', info.path);
      await storage.unlink(info.path);
    },
    async rename(from: ScriptPath, to: ScriptPath) {
      const source = await stat(from, 'rename');
      const destination = resolve(to);
      if (source.path === destination) return;
      await directory(path.dirname(destination), 'rename');
      const target = await storage.stat(destination);
      if (target?.isDirectory && source.isFile) throw fileError('EISDIR', 'rename', destination);
      if (target?.isFile && source.isDirectory) throw fileError('ENOTDIR', 'rename', destination);
      if (target?.isDirectory) unsupported('rename over an existing directory');
      await storage.rename(source.path, destination, { overwrite: true });
      if (await storage.stat(source.path) || !(await storage.stat(destination))) throw fileError('EIO', 'rename', source.path);
    },
    async rm(file: ScriptPath, options: { recursive?: boolean; force?: boolean } = {}) {
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
  const unavailableFS = ['lstat', 'realpath', 'copyFile', 'mkdtemp', 'open', 'close', 'read', 'readlink'];
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
  for (const name of ['watch', 'watchFile', 'unwatchFile', 'createReadStream', 'createWriteStream', 'Stats', 'Dirent']) {
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
    env: { HOME: homeDirectory, USER: shell.user, ...(shell.terminal ? { TERM: 'xterm-256color', COLORTERM: 'truecolor' } : {}), ...shell.env } as Record<string, string>,
    platform: 'browser',
    versions: Object.freeze(Object.create(null)) as Readonly<Record<string, string | undefined>>,
    nextTick(..._args: unknown[]) { return unsupported('process.nextTick Node scheduling semantics'); },
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
  // Do not evaluate unsupported scalar accessors when an ESM namespace enumerates exports.
  for (const name of ['version', 'pid', 'execPath', 'arch']) Object.defineProperty(process, name, { get: () => unsupported(`process.${name} (there is no host Node process)`) });
  const os = {
    homedir: () => typeof process.env.HOME === 'string' ? process.env.HOME : homeDirectory,
    ...Object.fromEntries(['cpus', 'availableParallelism', 'networkInterfaces', 'type', 'release', 'platform', 'arch', 'tmpdir'].map(name => [name, () => unsupported(`os.${name}`)])),
  };
  const url = { URL: globalThis.URL, URLSearchParams: globalThis.URLSearchParams, fileURLToPath: scriptFileURLToPath, pathToFileURL: (file: string) => scriptPathToFileURL(file, cwd) };
  const pathModule = createScriptPath(() => cwd);
  const util = createScriptUtil(() => process.argv.slice(2));
  const performanceHooks = createScriptPerformance(reportFailure);
  const workerThreads = createScriptWorkerThreads();
  const childProcess = createScriptChildProcess();
  const dns = createScriptDNS(tasks.track, reportFailure);
  const net = createScriptNet(getVirtualNetwork(shell.system), { track: tasks.track, reportError: reportFailure });
  const http = createScriptHTTP(net.module, reportFailure);
  const tty = createScriptTTY(io);
  const buffer = { Buffer };
  const assertions = createScriptAssert();
  const events = createScriptEvents({ track: tasks.track });
  const querystring = createScriptQuerystring();
  const crypto = createScriptCrypto({ track: tasks.track, reportError: reportFailure, isActive: () => active });
  const compatibility = createScriptNodeCompatibility();
  const readline = createReadlineModules(process.stdin, process.stdout);
  const timers = {
    ...timersPromises,
    setTimeout: tasks.wrap(timersPromises.setTimeout),
    setImmediate: tasks.wrap(timersPromises.setImmediate),
    scheduler: { wait: tasks.wrap(timersPromises.scheduler.wait), yield: tasks.wrap(timersPromises.scheduler.yield) },
  };
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
      case 'worker_threads': case 'node:worker_threads': return workerThreads;
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
    if (!commonJSUsed) return main(system, vue);
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
    } while (tasks.isActive() || io.isActive() || readline.isActive() || pending.size);
  };
  const dispose = () => {
    active = false;
    executionSignal?.removeEventListener('abort', interrupt);
    disposeScriptEvents(events); net.dispose(); tasks.dispose(); readline.dispose(); performanceHooks.dispose(); io.dispose(); process.removeAllListeners();
  };
  const injected = { Buffer, fs, process, console: scriptConsole, fetch: tasks.fetch, setTimeout: tasks.setTimeout, setInterval: tasks.setInterval, clearTimeout: tasks.clearTimeout, clearInterval: tasks.clearInterval };
  // Packages share Node-style globals within this execution. Writes stay off the host page.
  const globalValues: Record<string, unknown> = Object.assign(Object.create(null), injected);
  const scriptGlobal = new Proxy(globalValues, {
    get: (target, key, receiver) => Reflect.has(target, key) ? Reflect.get(target, key, receiver) : Reflect.get(globalThis, key, globalThis),
    has: (target, key) => Reflect.has(target, key) || Reflect.has(globalThis, key),
  });
  Object.assign(globalValues, { global: scriptGlobal, globalThis: scriptGlobal });
  const globals = { ...injected, global: scriptGlobal } as ScriptModuleContext['globals'];
  return { fs, process, require, requireBuiltin, globals, module, exports, runMain, tasks, setModuleResolver: (resolver?: ScriptModuleResolver) => { moduleResolver = resolver; }, markLoaded: () => { moduleState.loaded = true; }, console: scriptConsole, settle, failure, dispose };
}

export async function executeScript(code: string, shell: Shell, output: (text: string) => void, filename: string, args: string[], vue: unknown) {
  const offset = await scriptStackOffset();
  if (shell.executionSignal?.aborted) throw new ScriptFailure(formatScriptError(scriptAbortError(), code, filename, offset), scriptAbortError());
  const runtime = createScriptRuntime(shell, output, filename, args, error => formatScriptError(error, code, filename, offset));
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
        try { run = compileScript(body); }
        catch (error) {
          const position = error instanceof SyntaxError ? await locateSyntaxError(body, code) : undefined;
          throw new ScriptFailure(formatScriptError(error, code, filename, offset, position), error);
        }
        const importModule = (request: string, options?: unknown) => {
          if (!resolver?.importModule) throw new Error('This runtime does not provide a virtual module importer');
          return resolver.importModule(request, filename, options);
        };
        await run.call(runtime.exports, shell.system, vue, runtime.fs, runtime.process, runtime.require, runtime.console, filename, path.dirname(filename), runtime.module, runtime.exports, runtime.runMain, runtime.tasks.fetch, runtime.tasks.setTimeout, runtime.tasks.setInterval, runtime.tasks.clearTimeout, runtime.tasks.clearInterval, importModule, runtime.globals.global, runtime.globals.global, runtime.globals.Buffer);
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

