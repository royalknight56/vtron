import { resolve } from '@/packages/util/Path';

/** Convert between virtual POSIX paths and file: URLs; never access the host filesystem. */
export function scriptPathToFileURL(path: string, cwd = '/'): URL {
  if (typeof path !== 'string' || path.includes('\0')) throw new TypeError('Path must be a string without null bytes');
  return new URL('file://' + resolve(cwd, path).split('/').map(segment => encodeURIComponent(segment)).join('/'));
}

export function scriptFileURLToPath(input: string | URL): string {
  const url = typeof input === 'string' ? new URL(input) : input;
  if (!(url instanceof URL) || url.protocol !== 'file:') throw Object.assign(new TypeError('Expected a file: URL'), { code: 'ERR_INVALID_URL_SCHEME' });
  if (url.hostname && url.hostname !== 'localhost' || url.username || url.password) throw Object.assign(new TypeError('Virtual file URLs cannot reference a remote host'), { code: 'ERR_INVALID_FILE_URL_HOST' });
  if (/%(?:2f|5c)/i.test(url.pathname)) throw Object.assign(new TypeError('File URL path cannot include encoded path separators'), { code: 'ERR_INVALID_FILE_URL_PATH' });
  const path = decodeURIComponent(url.pathname);
  if (path.includes('\0')) throw new TypeError('File URL path cannot include null bytes');
  return resolve('/', path);
}
