import { dirname, isChildPath, join, resolve } from '../../util/Path';
import type { VtronFileInterface } from './FIleInterface';
import type { VtronFile, VtronFileWithoutContent } from './FileSystem';

function failure(code: string, path: string) { return Object.assign(new Error(`${code}: realpath '${path}'`), { code, path, syscall: 'realpath' }); }
function unsupported(path: string): never { throw Object.assign(new Error(`realpath cannot resolve symbolic links or non-exact path spelling: '${path}'`), { code: 'ERR_NOT_SUPPORTED', path, syscall: 'realpath' }); }

/** Traverse actual directory entries, including every component before '..'.
 * Never guess a symbolic-link target or a case-folded filename. */
export async function realpath(storage: Pick<VtronFileInterface, 'stat' | 'readdir'>, absolutePath: string): Promise<string> {
  if (typeof absolutePath !== 'string' || !absolutePath.startsWith('/') || absolutePath.includes('\0')) throw Object.assign(new TypeError('Expected an absolute Vtron path without null bytes'), { code: 'ERR_INVALID_ARG_VALUE' });
  let current = '/';
  let info = await storage.stat(current);
  if (!info) throw failure('ENOENT', current);
  if (info.isSymlink) unsupported(current);
  const segments = absolutePath.split('/').filter(Boolean);
  for (const part of segments) {
    if (!info.isDirectory) throw failure('ENOTDIR', current);
    if (part === '.') continue;
    if (part === '..') current = dirname(current);
    else {
      const entry = (await storage.readdir(current)).find(entry => entry.name === part);
      const candidate = join(current, part);
      if (!entry) {
        if (await storage.stat(candidate)) unsupported(candidate);
        throw failure('ENOENT', candidate);
      }
      if (entry.isSymlink) unsupported(candidate);
      current = join(current, entry.name);
    }
    const next = await storage.stat(current);
    if (!next) throw failure('ENOENT', current);
    if (next.isSymlink) unsupported(current);
    info = next;
  }
  if (absolutePath.endsWith('/') && !info.isDirectory) throw failure('ENOTDIR', current);
  return current;
}


type Storage = Pick<VtronFileInterface, 'stat' | 'mkdir'>;
function fsError(code: string, path: string) { return Object.assign(new Error(`${code}: mkdir '${path}'`), { code, path, syscall: 'mkdir' }); }

/** Shared by asynchronous mkdir and its Worker synchronous bridge. */
export async function mkdir(storage: Storage, path: string, recursive = false, signal?: AbortSignal): Promise<string | undefined> {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\0') || resolve(path) !== path) throw Object.assign(new TypeError('Expected a normalized absolute Vtron path'), { code: 'ERR_INVALID_ARG_VALUE' });
  const check = () => { if (signal?.aborted) throw Object.assign(new Error('mkdir interrupted; an in-flight backend operation may already have committed'), { code: 'ABORT_ERR' }); };
  const read = async (target: string) => { check(); const value = await storage.stat(target); check(); if (value?.isSymlink) throw Object.assign(new Error(`mkdir symbolic link traversal is not supported: '${target}'`), { code: 'ERR_NOT_SUPPORTED', path: target }); return value; };
  // Validate ancestors too; never traverse a link hidden by a backend's stat.
  const ancestors: string[] = [];
  for (let current = dirname(path); ; current = dirname(current)) { ancestors.unshift(current); if (current === '/') break; }
  for (const ancestor of ancestors) { const info = await read(ancestor); if (info && !info.isDirectory) throw fsError('ENOTDIR', ancestor); }
  let first: string | undefined;
  const create = async (target: string): Promise<void> => {
    const existing = await read(target);
    if (existing) { if (!recursive || !existing.isDirectory) throw fsError('EEXIST', target); return; }
    const parent = dirname(target);
    if (parent === target) throw fsError('ENOENT', target);
    if (recursive) await create(parent);
    else { const info = await read(parent); if (!info) throw fsError('ENOENT', parent); if (!info.isDirectory) throw fsError('ENOTDIR', parent); }
    check(); await storage.mkdir(target); check();
    const created = await read(target);
    if (!created?.isDirectory) throw fsError('EIO', target);
    first ??= target;
  };
  await create(path);
  return recursive ? first : undefined;
}


/** Strict existence query for backends whose stat returns null only on absence. */
export async function exists(storage: Pick<VtronFileInterface, 'stat'>, path: string, signal?: AbortSignal): Promise<boolean> {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\0') || resolve(path) !== path) throw Object.assign(new TypeError('Expected a normalized absolute Vtron path'), { code: 'ERR_INVALID_ARG_VALUE' });
  const parts = path.split('/').filter(Boolean);
  const paths = parts.map((_, index) => '/' + parts.slice(0, index + 1).join('/'));
  if (!paths.length) paths.push('/');
  let exists = false;
  for (const current of paths) {
    if (signal?.aborted) throw Object.assign(new Error('Filesystem query aborted'), { code: 'ABORT_ERR' });
    const info = await storage.stat(current);
    if (signal?.aborted) throw Object.assign(new Error('Filesystem query aborted'), { code: 'ABORT_ERR' });
    if (info?.isSymlink) throw Object.assign(new Error(`Cannot resolve symbolic link: ${current}`), { code: 'ERR_NOT_SUPPORTED' });
    exists = !!info;
  }
  return exists;
}

/** Strict metadata lookup. Strip content even if a backend returns a full file. */
export async function stat(storage: Pick<VtronFileInterface, 'stat'>, path: string, signal?: AbortSignal): Promise<VtronFileWithoutContent | null> {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\0') || resolve(path) !== path) throw Object.assign(new TypeError('Expected a normalized absolute Vtron path'), { code: 'ERR_INVALID_ARG_VALUE' });
  const paths = ['/'];
  const parts = path.split('/').filter(Boolean);
  for (let index = 1; index <= parts.length; index++) paths.push('/' + parts.slice(0, index).join('/'));
  let result: VtronFileWithoutContent | null = null;
  for (const current of paths) {
    if (signal?.aborted) throw Object.assign(new Error('Metadata query aborted'), { code: 'ABORT_ERR' });
    result = await storage.stat(current);
    if (signal?.aborted) throw Object.assign(new Error('Metadata query aborted'), { code: 'ABORT_ERR' });
    if (!result) return null;
    if (result.isSymlink) throw Object.assign(new Error(`Cannot resolve symbolic link: ${current}`), { code: 'ERR_NOT_SUPPORTED', path: current });
    if (current !== path && !result.isDirectory) throw Object.assign(new Error(`ENOTDIR: stat '${current}'`), { code: 'ENOTDIR', path: current });
  }
  const metadata = { ...result! };
  delete (metadata as Partial<VtronFile>).content;
  delete (metadata as Partial<VtronFile>).binary;
  return metadata;
}

/** Text-only write shared by async Node adapters and synchronous Worker RPC.
 * Binary data must be decoded losslessly by the caller before reaching here. */
export async function writeFile(storage: Pick<VtronFileInterface, 'stat' | 'writeFile'>, path: string, data: string, flag: 'w' | 'a' | 'wx' = 'w', signal?: AbortSignal): Promise<void> {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\0') || resolve(path) !== path) throw Object.assign(new TypeError('Expected a normalized absolute Vtron path'), { code: 'ERR_INVALID_ARG_VALUE' });
  if (typeof data !== 'string' || !['w', 'a', 'wx'].includes(flag)) throw Object.assign(new TypeError('write requires text and a supported file flag'), { code: 'ERR_INVALID_ARG_VALUE' });
  const check = () => { if (signal?.aborted) throw Object.assign(new Error('write interrupted; the backend may already have committed'), { code: 'ABORT_ERR' }); };
  const read = async (target: string) => { check(); const info = await storage.stat(target); check(); if (info?.isSymlink) throw Object.assign(new Error(`write symbolic link traversal is not supported: '${target}'`), { code: 'ERR_NOT_SUPPORTED', path: target }); return info; };
  const parts = path.split('/').filter(Boolean);
  const parents = ['/'];
  for (let index = 1; index < parts.length; index++) parents.push('/' + parts.slice(0, index).join('/'));
  for (const parent of parents) { const info = await read(parent); if (!info) throw Object.assign(new Error(`ENOENT: write '${parent}'`), { code: 'ENOENT', path: parent }); if (!info.isDirectory) throw Object.assign(new Error(`ENOTDIR: write '${parent}'`), { code: 'ENOTDIR', path: parent }); }
  const current = await read(path);
  if (current?.isDirectory) throw Object.assign(new Error(`EISDIR: write '${path}'`), { code: 'EISDIR', path });
  if (flag === 'wx' && current) throw Object.assign(new Error(`EEXIST: write '${path}'`), { code: 'EEXIST', path });
  check(); await storage.writeFile(path, data, { flag }); check();
}

/** Rename through the actual backend. Existing directories and symbolic-link
 * traversal are deliberately unsupported; atomicity belongs to the backend. */
export async function rename(storage: Pick<VtronFileInterface, 'stat' | 'rename'>, from: string, to: string, signal?: AbortSignal): Promise<void> {
  for (const path of [from, to]) if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\0') || resolve(path) !== path) throw Object.assign(new TypeError('Expected normalized absolute rename paths'), { code: 'ERR_INVALID_ARG_VALUE' });
  function fail(code: string, path: string): never { throw Object.assign(new Error(`${code}: rename '${from}' -> '${to}'`), { code, path, dest: to, syscall: 'rename' }); }
  const check = () => { if (signal?.aborted) throw Object.assign(new Error('rename interrupted; the backend may already have committed'), { code: 'ABORT_ERR' }); };
  const read = async (path: string) => {
    check(); const info = await storage.stat(path); check();
    if (info?.isSymlink) fail('ERR_NOT_SUPPORTED', path);
    return info;
  };
  for (const path of [from, to]) {
    const parents: string[] = [];
    for (let parent = dirname(path); ; parent = dirname(parent)) { parents.unshift(parent); if (parent === '/') break; }
    for (const parent of parents) { const info = await read(parent); if (!info) fail('ENOENT', parent); if (!info.isDirectory) fail('ENOTDIR', parent); }
  }
  const source = await read(from);
  if (!source) fail('ENOENT', from);
  if (from === to) return;
  if (from === '/' || to === '/') fail('EBUSY', from === '/' ? from : to);
  if (!source.isFile && !source.isDirectory) fail('ERR_NOT_SUPPORTED', from);
  if (source.isDirectory && isChildPath(from, to)) fail('EINVAL', to);
  const target = await read(to);
  if (target?.isDirectory && source.isFile) fail('EISDIR', to);
  if (target?.isFile && source.isDirectory) fail('ENOTDIR', to);
  if (target && !target.isFile) fail('ERR_NOT_SUPPORTED', to);
  check(); await storage.rename(from, to, { overwrite: true }); check();
  const old = await read(from), moved = await read(to);
  if (old || !moved || moved.isFile !== source.isFile || moved.isDirectory !== source.isDirectory) fail('EIO', from);
}
