import type { VtronFileWithoutContent } from 'vtron';
import { Buffer } from './scriptBuffer';

export interface ScriptSyncStorage {
  readFileSync(path: string): Uint8Array | null;
  writeBytesSync(path: string, bytes: Uint8Array, flag: 'w' | 'a' | 'wx'): void;
  statSync(path: string): VtronFileWithoutContent | null;
}
type Entry = { path: string; position: number; read: boolean; write: boolean; append: boolean };
const MAX_BYTES = 16 * 1024 * 1024;
const error = (code: string, message: string) => Object.assign(new Error(message), { code });

/** Execution-local virtual descriptors. Every read/write queries real storage;
 * descriptors never stand in for host OS file descriptors. */
export function createScriptDescriptors(storage: ScriptSyncStorage, resolve: (path: string | URL) => string, stdout: (bytes: Uint8Array) => unknown, stderr: (bytes: Uint8Array) => unknown) {
  let next = 3, nextInode = 1;
  const entries = new Map<number, Entry>(), inodes = new Map<string, number>();
  const get = (fd: number) => { const entry = entries.get(fd); if (!entry) throw error('EBADF', `Unknown file descriptor: ${fd}`); return entry; };
  const readPath = (path: string) => { const bytes = storage.readFileSync(path); if (bytes === null) throw error('ENOENT', `File does not exist: ${path}`); return bytes; };
  const flagsOf = (flag: string | number) => {
    if (typeof flag === 'number') {
      if (!Number.isInteger(flag) || flag < 0 || (flag & ~(3 | 64 | 128 | 512 | 1024 | 65536)) !== 0 || (flag & 3) === 3) throw error('ERR_NOT_SUPPORTED', 'Unsupported numeric open flags');
      return { read: (flag & 3) !== 1, write: (flag & 3) !== 0, create: !!(flag & 64), exclusive: !!(flag & 128), truncate: !!(flag & 512), append: !!(flag & 1024), directory: !!(flag & 65536) };
    }
    if (!/^(r\+?|w[x]?\+?|a[x]?\+?)$/.test(flag)) throw error('ERR_NOT_SUPPORTED', `Unsupported open flags: ${flag}`);
    return { read: flag.startsWith('r') || flag.includes('+'), write: !flag.startsWith('r') || flag.includes('+'), create: !flag.startsWith('r'), exclusive: flag.includes('x'), truncate: flag.startsWith('w'), append: flag.startsWith('a'), directory: false };
  };
  const range = (buffer: Uint8Array, offset: number, length: number, position: number | null | undefined) => {
    if (!(buffer instanceof Uint8Array)) throw new TypeError('Expected Uint8Array or Buffer');
    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(length) || length < 0 || offset + length > buffer.length) throw new RangeError('Invalid buffer range');
    if (position !== null && position !== undefined && (!Number.isSafeInteger(position) || position < 0)) throw new RangeError('Invalid file position');
  };
  function stats(path: string, bigint = false) {
    const info = storage.statSync(path); if (!info) throw error('ENOENT', `File does not exist: ${path}`);
    if (!inodes.has(path)) inodes.set(path, nextInode++);
    const number = (value: number) => bigint ? BigInt(Math.trunc(value)) : value;
    const mtime = new Date(info.mtime), atime = new Date(info.atime), birthtime = new Date(info.birthtime);
    const ctime = (info as VtronFileWithoutContent & { ctime?: Date | number | string }).ctime;
    const result = {
      ...info, dev: number(0), ino: number(inodes.get(path)!), nlink: number(1),
      mode: number((info.isDirectory ? 0o040000 : 0o100000) | (info.mode & 0o777)), size: number(info.size), rdev: number(info.rdev),
      mtime, atime, birthtime, mtimeMs: number(mtime.getTime()), atimeMs: number(atime.getTime()), birthtimeMs: number(birthtime.getTime()),
      isFile: () => info.isFile, isDirectory: () => info.isDirectory, isSymbolicLink: () => info.isSymlink,
      isSocket: () => false, isFIFO: () => false, isBlockDevice: () => false, isCharacterDevice: () => false,
    };
    Object.defineProperties(result, {
      ctime: { enumerable: true, get() { if (ctime === undefined) throw error('ENOSYS', 'This backend has no change-time metadata'); return new Date(ctime); } },
      ctimeMs: { enumerable: true, get() { if (ctime === undefined) throw error('ENOSYS', 'This backend has no change-time metadata'); return number(new Date(ctime).getTime()); } },
    });
    return result;
  }
  function openSync(file: string | URL, flag: string | number = 'r', mode = 0o666) {
    if (mode !== 0o666) throw error('ENOSYS', 'Custom open permission modes are unsupported');
    if (entries.size >= 1024 || next >= Number.MAX_SAFE_INTEGER) throw error('EMFILE', 'Virtual file descriptor limit reached');
    const path = resolve(file), flags = flagsOf(flag), info = storage.statSync(path);
    if (!info && !flags.create) throw error('ENOENT', `File does not exist: ${path}`);
    if (info && flags.create && flags.exclusive) throw error('EEXIST', `File exists: ${path}`);
    if (info?.isSymlink) throw error('ENOSYS', 'Symbolic-link descriptors are unsupported');
    if (flags.directory && !info?.isDirectory) throw error('ENOTDIR', `Not a directory: ${path}`);
    if (info?.isDirectory && (flags.write || flags.truncate || flags.append)) throw error('EISDIR', `Cannot write a directory: ${path}`);
    if ((!info || flags.truncate) && !flags.write) throw error('EINVAL', 'Creating/truncating requires write access');
    if (!info || flags.truncate) storage.writeBytesSync(path, new Uint8Array(), flags.exclusive ? 'wx' : 'w');
    const fd = next++; entries.set(fd, { path, position: 0, read: flags.read, write: flags.write, append: flags.append }); return fd;
  }
  function readSync(fd: number, buffer: Uint8Array, offset = 0, length = buffer.length - offset, position?: number | null) {
    range(buffer, offset, length, position);
    if (fd === 0) throw error('EAGAIN', 'Synchronous terminal input is unavailable');
    const entry = get(fd); if (!entry.read) throw error('EBADF', 'Descriptor is not readable');
    if (storage.statSync(entry.path)?.isDirectory) throw error('EISDIR', 'Cannot read a directory');
    const bytes = readPath(entry.path), from = position ?? entry.position, count = Math.max(0, Math.min(length, bytes.length - from));
    buffer.set(bytes.subarray(from, from + count), offset); if (position === null || position === undefined) entry.position += count; return count;
  }
  function writeSync(fd: number, data: Uint8Array | string, offset = 0, length?: number, position?: number | null) {
    const bytes = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    length ??= bytes.length - offset; range(bytes, offset, length, position);
    const input = bytes.subarray(offset, offset + length);
    if (fd === 1 || fd === 2) { (fd === 1 ? stdout : stderr)(input); return length; }
    const entry = get(fd); if (!entry.write) throw error('EBADF', 'Descriptor is not writable');
    if (entry.append) { storage.writeBytesSync(entry.path, input, 'a'); entry.position = storage.statSync(entry.path)!.size; return length; }
    const old = readPath(entry.path), from = position ?? entry.position;
    if (from + length > MAX_BYTES) throw error('EFBIG', 'Descriptor writes are limited to 16 MiB');
    const result = new Uint8Array(Math.max(old.length, from + length)); result.set(old); result.set(input, from);
    storage.writeBytesSync(entry.path, result, 'w'); if (position === null || position === undefined) entry.position = from + length; return length;
  }
  return {
    openSync, readSync, writeSync,
    closeSync(fd: number) { get(fd); entries.delete(fd); },
    fstatSync(fd: number, options?: { bigint?: boolean }) { return stats(get(fd).path, options?.bigint); },
    stat: stats,
    ftruncateSync(fd: number, length = 0) {
      const entry = get(fd); if (!entry.write) throw error('EBADF', 'Descriptor is not writable');
      if (!Number.isSafeInteger(length) || length < 0 || length > MAX_BYTES) throw error('EINVAL', 'Invalid truncate length');
      const bytes = readPath(entry.path), result = new Uint8Array(length); result.set(bytes.subarray(0, length)); storage.writeBytesSync(entry.path, result, 'w');
    },
    assertCanMutate(path: string) { for (const entry of entries.values()) if (entry.path === path || entry.path.startsWith(path + '/')) throw error('ENOSYS', 'Renaming/removing an open file is not supported'); },
    dispose() { entries.clear(); inodes.clear(); },
  };
}
