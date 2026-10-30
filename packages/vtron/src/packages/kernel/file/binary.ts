import type { VtronFileInterface } from './FIleInterface';
import { dirname, resolve } from '../../util/Path';

export function encodeFileBytes(bytes: Uint8Array): string {
  let result = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) result += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(result);
}
export function decodeFileBytes(value: string): Uint8Array {
  const raw = atob(value);
  return Uint8Array.from(raw, char => char.charCodeAt(0));
}
export function decodeFileText(bytes: Uint8Array): string {
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { throw Object.assign(new Error('File is not valid UTF-8; use readBinaryFile'), { code: 'ERR_FS_BINARY_ENCODING' }); }
}
export async function readFileBytes(storage: Pick<VtronFileInterface, 'readFile' | 'readBinaryFile'>, path: string): Promise<Uint8Array | null> {
  if (storage.readBinaryFile) return storage.readBinaryFile(path);
  const text = await storage.readFile(path);
  return text === null ? null : new TextEncoder().encode(text);
}
export async function writeFileBytes(storage: Pick<VtronFileInterface, 'stat' | 'writeFile' | 'writeBinaryFile'>, path: string, data: Uint8Array, options?: { flag?: 'w' | 'a' | 'wx' }): Promise<void> {
  if (!(data instanceof Uint8Array)) throw new TypeError('File bytes must be a Uint8Array');
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\0') || resolve(path) !== path) throw new TypeError('Expected a normalized absolute file path');
  const flag = options?.flag ?? 'w';
  if (!['w', 'a', 'wx'].includes(flag)) throw Object.assign(new Error('Unsupported write flag'), { code: 'ERR_NOT_SUPPORTED' });
  for (let current = path; ; current = dirname(current)) {
    const info = await storage.stat(current);
    if (info?.isSymlink) throw Object.assign(new Error('Symbolic-link writes are unsupported'), { code: 'ERR_NOT_SUPPORTED' });
    if (current === path) {
      if (info?.isDirectory) throw Object.assign(new Error('Cannot write a directory'), { code: 'EISDIR' });
      if (info && flag === 'wx') throw Object.assign(new Error('File already exists'), { code: 'EEXIST' });
    } else {
      if (!info) throw Object.assign(new Error('Parent does not exist'), { code: 'ENOENT' });
      if (!info.isDirectory) throw Object.assign(new Error('Parent is not a directory'), { code: 'ENOTDIR' });
    }
    if (current === '/') break;
  }
  if (storage.writeBinaryFile) return storage.writeBinaryFile(path, data, options);
  return storage.writeFile(path, decodeFileText(data), options);
}
