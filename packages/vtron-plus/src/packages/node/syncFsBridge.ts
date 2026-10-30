import type { VtronFileWithoutContent } from 'vtron';
/** Dedicated MessagePort protocol for an experimental synchronous filesystem query.
 * The host query must distinguish missing paths from backend failures, and must
 * reject links it cannot resolve. The bridge never infers absence from errors.
 */
export type SyncExistsQuery = (absolutePath: string, signal: AbortSignal) => Promise<boolean>;
export type SyncMkdirQuery = (absolutePath: string, recursive: boolean, signal: AbortSignal) => Promise<string | undefined>;
export type SyncWriteQuery = (absolutePath: string, data: string, flag: 'w' | 'a' | 'wx', signal: AbortSignal) => Promise<void>;
export type SyncReaddirQuery = (path: string, signal: AbortSignal) => Promise<VtronFileWithoutContent[]>;
export type SyncReadBytesQuery = (path: string, signal: AbortSignal) => Promise<Uint8Array | null>;
export type SyncWriteBytesQuery = (path: string, data: Uint8Array, flag: 'w' | 'a' | 'wx', signal: AbortSignal) => Promise<void>;
export type SyncRealpathQuery = (path: string, signal: AbortSignal) => Promise<string>;
export type SyncStatQuery = (path: string, signal: AbortSignal) => Promise<VtronFileWithoutContent | null>;
type SyncResult = VtronFileWithoutContent[] | Uint8Array | boolean | string | VtronFileWithoutContent | null | undefined;
export type SyncRenameQuery = (from: string, to: string, signal: AbortSignal) => Promise<void>;
export interface SyncExistsClientOptions { timeoutMs?: number }
export interface SyncExistsHost { dispose(): void }
export interface SyncExistsClient { readdirSync(path: string): VtronFileWithoutContent[]; readFileSync(path: string): Uint8Array | null; writeBytesSync(path: string, data: Uint8Array, flag: 'w' | 'a' | 'wx'): void; realpathSync(path: string): string; statSync(path: string): VtronFileWithoutContent | null; renameSync(from: string, to: string): void; existsSync(absolutePath: string): boolean; mkdirSync(absolutePath: string, recursive: boolean): string | undefined; writeFileSync(absolutePath: string, data: string, flag: 'w' | 'a' | 'wx'): void; dispose(): void }

type Request = { type: 'vtron:sync-fs:exists' | 'vtron:sync-fs:mkdir' | 'vtron:sync-fs:write' | 'vtron:sync-fs:rename' | 'vtron:sync-fs:stat' | 'vtron:sync-fs:realpath' | 'vtron:sync-fs:read-bytes' | 'vtron:sync-fs:write-bytes' | 'vtron:sync-fs:readdir'; bytes?: Uint8Array; destination?: string; data?: string; flag?: 'w' | 'a' | 'wx'; recursive?: boolean; id: number; path: string; buffer: SharedArrayBuffer; timeoutMs: number };
const REQUEST = 'vtron:sync-fs:exists';
const MKDIR = 'vtron:sync-fs:mkdir';
const WRITE = 'vtron:sync-fs:write';
const RENAME = 'vtron:sync-fs:rename';
const STAT = 'vtron:sync-fs:stat';
const REALPATH = 'vtron:sync-fs:realpath';
const READ_BYTES = 'vtron:sync-fs:read-bytes', WRITE_BYTES = 'vtron:sync-fs:write-bytes';
const BINARY = 6;
const READDIR = 'vtron:sync-fs:readdir';
const MAX_WRITE_BYTES = 16 * 1024 * 1024;
const RESULT = 5;
const REGISTER = 'vtron:sync-fs:register';
const UNREGISTER = 'vtron:sync-fs:unregister';
const CANCEL = 'vtron:sync-fs:cancel';
const PENDING = 0, EXISTS = 1, MISSING = 2, FAILED = 3, ABANDONED = 4;
const HEADER_BYTES = 8;
const ERROR_BYTES = 8192;
const BUFFER_BYTES = HEADER_BYTES + ERROR_BYTES;
const error = (code: string, message: string) => Object.assign(new Error(message), { code });
let nextClientId = 0;
let nextRequestId = 0;

function fail(buffer: SharedArrayBuffer, failure: unknown) {
  const state = new Int32Array(buffer, 0, 2);
  if (Atomics.load(state, 0) !== PENDING) return;
  const value = failure && typeof failure === 'object' ? failure as { code?: unknown; message?: unknown } : undefined;
  const code = typeof value?.code === 'string' ? value.code.slice(0, 128) : 'ERR_SYNC_FS_QUERY';
  const message = String(value?.message ?? failure ?? 'Filesystem query failed').slice(0, 1000);
  const bytes = new TextEncoder().encode(JSON.stringify({ code, message }));
  new Uint8Array(buffer, HEADER_BYTES).set(bytes);
  Atomics.store(state, 1, bytes.length);
  if (Atomics.compareExchange(state, 0, PENDING, FAILED) === PENDING) Atomics.notify(state, 0);
}

/** Handle filesystem requests asynchronously on the thread owning Vtron's FS. */
export function startSyncExistsHost(port: MessagePort, query: SyncExistsQuery, operations: { mkdir?: SyncMkdirQuery; write?: SyncWriteQuery; rename?: SyncRenameQuery; stat?: SyncStatQuery; realpath?: SyncRealpathQuery; readBytes?: SyncReadBytesQuery; writeBytes?: SyncWriteBytesQuery; readdir?: SyncReaddirQuery } = {}): SyncExistsHost {
  if (typeof query !== 'function') throw new TypeError('A strict asynchronous exists query is required');
  if (typeof SharedArrayBuffer === 'undefined') throw error('ERR_SYNC_FS_ISOLATION_REQUIRED', 'SharedArrayBuffer is required for synchronous filesystem access');
  const pending = new Map<number, { buffer: SharedArrayBuffer; controller: AbortController; timer: ReturnType<typeof setTimeout> }>();
  const controls = new Map<number, SharedArrayBuffer>();
  let disposed = false;
  const receive = (event: MessageEvent<unknown>) => {
    const request = event.data as (Partial<Request> & { control?: SharedArrayBuffer }) | null;
    if (request && (request.type as string) === REGISTER && Number.isSafeInteger(request.id) && typeof request.id === 'number' && request.id > 0 && request.control instanceof SharedArrayBuffer && request.control.byteLength === 4) {
      controls.set(request.id, request.control);
      return;
    }
    if (request && (request.type as string) === UNREGISTER && typeof request.id === 'number') { controls.delete(request.id); return; }
    if (request && (request.type as string) === CANCEL && typeof request.id === 'number') {
      const item = pending.get(request.id);
      if (item) { pending.delete(request.id); clearTimeout(item.timer); item.controller.abort(); }
      return;
    }
    if (!request || (request.type !== REQUEST && request.type !== MKDIR && request.type !== WRITE && request.type !== RENAME && request.type !== STAT && request.type !== REALPATH && request.type !== READ_BYTES && request.type !== WRITE_BYTES && request.type !== READDIR) || !(request.buffer instanceof SharedArrayBuffer) || request.buffer.byteLength !== ((request.type === READ_BYTES || request.type === READDIR) ? HEADER_BYTES + MAX_WRITE_BYTES : BUFFER_BYTES)) return;
    const { buffer, path, id } = request;
    if (disposed) { fail(buffer, error('ERR_SYNC_FS_CLOSED', 'Synchronous filesystem bridge is closed')); return; }
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1) { fail(buffer, error('ERR_SYNC_FS_PROTOCOL', 'Invalid filesystem request ID')); return; }
    if (pending.has(id)) { fail(buffer, error('ERR_SYNC_FS_PROTOCOL', 'Duplicate filesystem request')); return; }
    if (typeof request.timeoutMs !== 'number' || !Number.isFinite(request.timeoutMs) || request.timeoutMs <= 0 || request.timeoutMs > 2147483647) {
      fail(buffer, error('ERR_SYNC_FS_PROTOCOL', 'Invalid filesystem request timeout'));
      return;
    }
    if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\0') || (path !== '/' && path.split('/').some((part, index) => index > 0 && (!part || part === '.' || part === '..')))) {
      fail(buffer, error('ERR_SYNC_FS_INVALID_PATH', 'Expected a normalized absolute Vtron path'));
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      fail(buffer, error('ERR_SYNC_FS_TIMEOUT', 'Synchronous filesystem query timed out'));
      if (pending.get(id)?.controller === controller) pending.delete(id);
    }, request.timeoutMs);
    pending.set(id, { buffer, controller, timer });
    void Promise.resolve().then<SyncResult>(() => {
      if (request.type === REQUEST) return query(path, controller.signal);
      if (request.type === READDIR) {
        if (!operations.readdir) throw error('ERR_NOT_SUPPORTED', 'Synchronous readdir is not installed');
        return operations.readdir(path, controller.signal);
      }
      if (request.type === READ_BYTES) {
        if (!operations.readBytes) throw error('ERR_NOT_SUPPORTED', 'Synchronous binary reads are not installed');
        return operations.readBytes(path, controller.signal);
      }
      if (request.type === WRITE_BYTES) {
        if (!(request.bytes instanceof Uint8Array) || request.bytes.length > MAX_WRITE_BYTES || !['w', 'a', 'wx'].includes(request.flag || '')) throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid binary write');
        if (!operations.writeBytes) throw error('ERR_NOT_SUPPORTED', 'Synchronous binary writes are not installed');
        return operations.writeBytes(path, request.bytes, request.flag!, controller.signal).then(() => undefined);
      }
      if (request.type === REALPATH) {
        if (!operations.realpath) throw error('ERR_NOT_SUPPORTED', 'Synchronous realpath is not installed on the host');
        return operations.realpath(path, controller.signal);
      }
      if (request.type === STAT) {
        if (!operations.stat) throw error('ERR_NOT_SUPPORTED', 'Synchronous stat is not installed on the host');
        return operations.stat(path, controller.signal);
      }
      if (request.type === RENAME) {
        const to = request.destination;
        if (typeof to !== 'string' || !to.startsWith('/') || to.includes('\0') || (to !== '/' && to.split('/').some((part, index) => index > 0 && (!part || part === '.' || part === '..')))) throw error('ERR_SYNC_FS_INVALID_PATH', 'Expected a normalized absolute rename destination');
        if (!operations.rename) throw error('ERR_NOT_SUPPORTED', 'Synchronous rename is not installed on the host');
        return operations.rename(path, to, controller.signal).then(() => undefined);
      }
      if (request.type === WRITE) {
        if (typeof request.data !== 'string' || !['w', 'a', 'wx'].includes(request.flag || '') || new TextEncoder().encode(request.data).byteLength > MAX_WRITE_BYTES) throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid or oversized synchronous write');
        if (!operations.write) throw error('ERR_NOT_SUPPORTED', 'Synchronous write is not installed on the host');
        return operations.write(path, request.data, request.flag!, controller.signal).then(() => undefined);
      }
      if (typeof request.recursive !== 'boolean') throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid recursive mkdir option');
      if (!operations.mkdir) throw error('ERR_NOT_SUPPORTED', 'Synchronous mkdir is not installed on the host');
      return operations.mkdir(path, request.recursive, controller.signal);
    }).then(result => {
      const state = new Int32Array(buffer, 0, 2);
      if (Atomics.load(state, 0) !== PENDING) return;
      let status: number;
      if (request.type === READ_BYTES) {
        if (result === null) status = MISSING;
        else {
          if (!(result instanceof Uint8Array)) throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid binary read result');
          if (result.length > MAX_WRITE_BYTES) throw error('ERR_FS_FILE_TOO_LARGE', 'Synchronous reads are limited to 16 MiB');
          new Uint8Array(buffer, HEADER_BYTES).set(result); Atomics.store(state, 1, result.length); status = BINARY;
        }
      } else if (request.type === REQUEST) {
        if (typeof result !== 'boolean') throw error('ERR_SYNC_FS_PROTOCOL', 'Filesystem query did not return a boolean');
        status = result ? EXISTS : MISSING;
      } else {
        if (request.type !== STAT && request.type !== READDIR && result !== undefined && typeof result !== 'string') throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid filesystem result');
        const bytes = new TextEncoder().encode(JSON.stringify({ value: result ?? null }));
        if (bytes.length > buffer.byteLength - HEADER_BYTES) throw error('ERR_SYNC_FS_RESULT_TOO_LARGE', 'Filesystem result exceeds bridge response capacity');
        new Uint8Array(buffer, HEADER_BYTES).set(bytes); Atomics.store(state, 1, bytes.length);
        status = RESULT;
      }
      if (Atomics.compareExchange(state, 0, PENDING, status) === PENDING) Atomics.notify(state, 0);
    }).catch(failure => fail(buffer, failure)).finally(() => { clearTimeout(timer); if (pending.get(id)?.controller === controller) pending.delete(id); });
  };
  port.addEventListener('message', receive);
  port.start();
  return { dispose() {
    if (disposed) return;
    disposed = true;
    port.removeEventListener('message', receive);
    for (const control of controls.values()) { Atomics.store(new Int32Array(control), 0, 1); Atomics.notify(new Int32Array(control), 0); }
    controls.clear();
    for (const { buffer, controller, timer } of pending.values()) {
      clearTimeout(timer);
      controller.abort();
      fail(buffer, error('ERR_SYNC_FS_CLOSED', 'Synchronous filesystem bridge is closed'));
    }
    pending.clear();
    port.close();
  } };
}

/** Use only from a dedicated Worker; Atomics.wait must not block the host thread. */
export function createSyncExistsClient(port: MessagePort, options: SyncExistsClientOptions = {}): SyncExistsClient {
  const timeoutMs = options.timeoutMs ?? 10000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2147483647) throw new RangeError('timeoutMs must be a positive finite number within the timer limit');
  if (typeof SharedArrayBuffer === 'undefined') throw error('ERR_SYNC_FS_ISOLATION_REQUIRED', 'SharedArrayBuffer is required for synchronous filesystem access');
  if (nextClientId >= Number.MAX_SAFE_INTEGER) throw error('ERR_SYNC_FS_PROTOCOL', 'Filesystem client ID limit reached');
  const clientId = ++nextClientId;
  const control = new Int32Array(new SharedArrayBuffer(4));
  try { port.postMessage({ type: REGISTER, id: clientId, control: control.buffer }); }
  catch (failure) { throw error('ERR_SYNC_FS_TRANSPORT', `Cannot initialize filesystem bridge: ${String(failure)}`); }
  let disposed = false;
  const request = (type: Request['type'], path: string, recursive?: boolean, data?: string, flag?: 'w' | 'a' | 'wx', destination?: string, bytes?: Uint8Array): SyncResult => {
      if (disposed || Atomics.load(control, 0)) throw error('ERR_SYNC_FS_CLOSED', 'Synchronous filesystem bridge is closed');
      if (nextRequestId >= Number.MAX_SAFE_INTEGER) throw error('ERR_SYNC_FS_PROTOCOL', 'Filesystem request ID limit reached');
      const id = ++nextRequestId;
      const buffer = new SharedArrayBuffer((type === READ_BYTES || type === READDIR) ? HEADER_BYTES + MAX_WRITE_BYTES : BUFFER_BYTES);
      const state = new Int32Array(buffer, 0, 2);
      const cancel = () => { try { port.postMessage({ type: CANCEL, id }); } catch {} };
      try { port.postMessage({ type, id, path, recursive, data, flag, destination, bytes, buffer, timeoutMs } satisfies Request); }
      catch (failure) { throw error('ERR_SYNC_FS_TRANSPORT', `Cannot send filesystem query: ${String(failure)}`); }
      let outcome: string;
      try { outcome = Atomics.wait(state, 0, PENDING, timeoutMs); }
      catch { Atomics.compareExchange(state, 0, PENDING, ABANDONED); cancel(); throw error('ERR_SYNC_FS_WORKER_REQUIRED', 'Synchronous filesystem queries require a Worker that permits Atomics.wait'); }
      if (outcome === 'timed-out' && Atomics.compareExchange(state, 0, PENDING, ABANDONED) === PENDING) {
        cancel();
        if (Atomics.load(control, 0)) throw error('ERR_SYNC_FS_CLOSED', 'Synchronous filesystem bridge is closed');
        throw error('ERR_SYNC_FS_TIMEOUT', `Filesystem query timed out after ${timeoutMs} ms`);
      }
      const status = Atomics.load(state, 0);
      if (status === BINARY) {
        const length = Atomics.load(state, 1);
        if (type !== READ_BYTES || length < 0 || length > MAX_WRITE_BYTES) throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid binary response length');
        return new Uint8Array(buffer, HEADER_BYTES, length).slice();
      }
      if (status === EXISTS) return true;
      if (status === MISSING) return false;
      if (status === RESULT) {
        const length = Atomics.load(state, 1);
        if (length < 0 || length > buffer.byteLength - HEADER_BYTES) throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid filesystem result length');
        const value = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, HEADER_BYTES, length).slice())).value;
        if (value !== null && typeof value !== 'string' && !((type === STAT || type === READDIR) && typeof value === 'object')) throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid filesystem response');
        return value === null ? undefined : value;
      }
      if (status === FAILED) {
        const length = Atomics.load(state, 1);
        if (length < 0 || length > buffer.byteLength - HEADER_BYTES) throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid filesystem error response length');
        let payload: { code: string; message: string };
        try {
          // Chrome does not allow TextDecoder to read a shared ArrayBuffer view.
          payload = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, HEADER_BYTES, length).slice()));
          if (!payload || typeof payload.code !== 'string' || typeof payload.message !== 'string') throw new TypeError('Invalid error fields');
        } catch { throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid filesystem error response'); }
        throw error(payload.code, payload.message);
      }
      Atomics.compareExchange(state, 0, PENDING, ABANDONED);
      cancel();
      throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid synchronous filesystem response');
    };
  return {
    readdirSync(path) {
      const value = request(READDIR, path);
      if (!Array.isArray(value) || value.some(item => !item || typeof item.name !== 'string')) throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid readdir response');
      return value;
    },
    readFileSync(path) {
      const value = request(READ_BYTES, path);
      if (value === false) return null;
      if (!(value instanceof Uint8Array)) throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid binary response');
      return value;
    },
    writeBytesSync(path, bytes, flag) {
      if (!(bytes instanceof Uint8Array) || bytes.length > MAX_WRITE_BYTES) throw error('ERR_FS_FILE_TOO_LARGE', 'Synchronous writes are limited to 16 MiB');
      if (request(WRITE_BYTES, path, undefined, undefined, flag, undefined, bytes.slice()) !== undefined) throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid write response');
    },
    existsSync(path) {
      const value = request(REQUEST, path);
      if (typeof value !== 'boolean') throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid exists response');
      return value;
    },
    mkdirSync(path, recursive) {
      const value = request(MKDIR, path, recursive);
      if (value !== undefined && typeof value !== 'string') throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid filesystem response');
      return value;
    },
    realpathSync(path) {
      const value = request(REALPATH, path);
      if (typeof value !== 'string') throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid realpath response');
      return value;
    },
    statSync(path) {
      const value = request(STAT, path);
      if (value === undefined) return null;
      if (!value || typeof value !== 'object' || value instanceof Uint8Array || Array.isArray(value) || typeof value.path !== 'string' || typeof value.isFile !== 'boolean' || typeof value.isDirectory !== 'boolean' || typeof value.isSymlink !== 'boolean') throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid stat response');
      return value;
    },
    renameSync(from, to) {
      if (request(RENAME, from, undefined, undefined, undefined, to) !== undefined) throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid rename response');
    },
    writeFileSync(path, data, flag) {
      if (typeof data !== 'string' || new TextEncoder().encode(data).byteLength > MAX_WRITE_BYTES) throw error('ERR_FS_FILE_TOO_LARGE', 'Synchronous text writes are limited to 16 MiB');
      if (request(WRITE, path, undefined, data, flag) !== undefined) throw error('ERR_SYNC_FS_PROTOCOL', 'Invalid write response');
    },
    dispose() { if (disposed) return; disposed = true; Atomics.store(control, 0, 1); try { port.postMessage({ type: UNREGISTER, id: clientId }); } catch {} port.close(); },
  };
}
