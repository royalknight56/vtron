import streams from 'readable-stream';
import { readFileBytes, stat, type VtronFileInterface } from 'vtron';
import { Buffer } from './scriptBuffer';

type Options = { encoding?: string | null; flags?: string; start?: number; end?: number; highWaterMark?: number; emitClose?: boolean; autoClose?: boolean; signal?: AbortSignal };
const MAX_BYTES = 16 * 1024 * 1024;
const unsupported = (name: string): never => { throw Object.assign(new Error(`createReadStream ${name} is not supported by the Vtron browser runtime`), { code: 'ERR_NOT_SUPPORTED' }); };

/** Vtron stores whole UTF-8 strings, so this is a bounded buffered source with
 * real byte-range reads and Readable backpressure, not an OS file descriptor. */
export function createScriptReadStream(hooks: { storage: VtronFileInterface; resolve: (path: string | URL) => string; track: <T>(promise: Promise<T>) => Promise<T>; reportError: (error: unknown) => void }) {
  const active = new Set<streams.Readable>();
  function createReadStream(file: string | URL, options?: Options | string | null) {
    const settings: Options = typeof options === 'string' ? { encoding: options } : options ?? {};
    if (typeof settings !== 'object' || Array.isArray(settings)) throw new TypeError('createReadStream options must be an object or encoding');
    for (const [key, value] of Object.entries(settings)) if (value !== undefined && !['encoding', 'flags', 'start', 'end', 'highWaterMark', 'emitClose', 'autoClose', 'signal'].includes(key)) unsupported(`option ${key}`);
    if (settings.flags !== undefined && settings.flags !== 'r') unsupported(`flags ${settings.flags}`);
    if (settings.autoClose !== undefined && settings.autoClose !== true) unsupported('autoClose: false');
    if (settings.encoding && !['utf8', 'utf-8'].includes(settings.encoding)) unsupported(`encoding ${settings.encoding}`);
    if (settings.emitClose !== undefined && settings.emitClose !== true) unsupported('emitClose: false');
    const start = settings.start ?? 0, end = settings.end ?? Number.MAX_SAFE_INTEGER, chunkSize = settings.highWaterMark ?? 64 * 1024;
    if (!Number.isSafeInteger(start) || start < 0 || !Number.isSafeInteger(end) || end < start) throw new RangeError('Expected non-negative byte range with end >= start');
    if (!Number.isSafeInteger(chunkSize) || chunkSize < 1 || chunkSize > MAX_BYTES) throw new RangeError('highWaterMark must be between 1 and 16 MiB');
    const path = hooks.resolve(file);
    let release: (() => void) | undefined, bytesRead = 0, pending = true;
    const hold = () => { if (!release && !stream.destroyed && !stream.readableEnded) hooks.track(new Promise<void>(resolve => { release = resolve; })); };
    const source = async function* () {
      hold();
      try {
        const info = await stat(hooks.storage, path);
        if (!info) throw Object.assign(new Error(`ENOENT: open '${path}'`), { code: 'ENOENT', path });
        if (!info.isFile) throw Object.assign(new Error(`EISDIR: read '${path}'`), { code: 'EISDIR', path });
        const content = await readFileBytes(hooks.storage, path);
        if (content === null) throw Object.assign(new Error(`ENOENT: read '${path}'`), { code: 'ENOENT', path });
        const data = Buffer.from(content);
        if (data.byteLength > MAX_BYTES) throw Object.assign(new Error('Buffered read streams are limited to 16 MiB'), { code: 'ERR_FS_FILE_TOO_LARGE', path });
        pending = false;
        for (let offset = start; !stream.destroyed && offset < data.length && offset <= end; offset += chunkSize) {
          const chunk = data.subarray(offset, Math.min(offset + chunkSize, end + 1, data.length));
          bytesRead += chunk.length; yield chunk;
        }
      } finally { pending = false; }
    };
    const stream = streams.Readable.from(source(), { objectMode: false, highWaterMark: chunkSize, emitClose: settings.emitClose, signal: settings.signal, encoding: settings.encoding ? 'utf8' : undefined });
    active.add(stream);
    const cleanup = () => { active.delete(stream); release?.(); release = undefined; };
    stream.on('newListener', name => { if (name === 'data' || name === 'readable') hold(); });
    const read = stream.read, resume = stream.resume;
    stream.read = function (size?: number) { hold(); return read.call(this, size); };
    stream.resume = function () { hold(); return resume.call(this); };
    stream.once('end', cleanup); stream.once('close', cleanup);
    stream.on('error', error => { cleanup(); if (stream.listenerCount('error') === 1) hooks.reportError(error); });
    const result = Object.assign(stream, {
      path,
      close(callback?: () => void) { if (callback) { if (stream.closed) queueMicrotask(callback); else stream.once('close', callback); } stream.destroy(); },
    });
    Object.defineProperties(result, {
      bytesRead: { get: () => bytesRead }, pending: { get: () => pending },
      fd: { get: () => unsupported('OS file descriptors') },
    });
    return result;
  }
  return { createReadStream, dispose() { for (const stream of active) stream.destroy(); active.clear(); } };
}
