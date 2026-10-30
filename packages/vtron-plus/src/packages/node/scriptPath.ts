import * as paths from 'vtron';

type ParsedPath = { root: string; dir: string; base: string; ext: string; name: string };
type PathObject = Partial<ParsedPath>;
export interface ScriptPath {
  sep: string;
  delimiter: string;
  normalize(path: string): string;
  join(...paths: string[]): string;
  resolve(...paths: string[]): string;
  relative(from: string, to: string): string;
  isAbsolute(path: string): boolean;
  basename(path: string, suffix?: string): string;
  dirname(path: string): string;
  extname(path: string): string;
  parse(path: string): ParsedPath;
  format(path: PathObject): string;
  toNamespacedPath<T>(path: T): T;
  posix: ScriptPath;
  win32: ScriptPath;
}

function pathArgument(value: unknown): asserts value is string {
  if (typeof value !== 'string') throw Object.assign(new TypeError('path must be a string'), { code: 'ERR_INVALID_ARG_TYPE' });
}

/** POSIX paths resolve relative to the virtual script directory, never the host OS. */
export function createScriptPath(cwd: () => string): ScriptPath {
  function resolve(...segments: string[]) { return paths.resolve(cwd(), ...segments); }
  function dirname(path: string) {
    pathArgument(path);
    if (!path.length) return '.';
    const root = path[0] === '/';
    let end = -1;
    let trailing = true;
    for (let index = path.length - 1; index >= 1; index--) {
      if (path[index] === '/') {
        if (!trailing) { end = index; break; }
      } else trailing = false;
    }
    if (end === -1) return root ? '/' : '.';
    if (root && end === 1) return '//';
    return path.slice(0, end);
  }
  function basename(path: string, suffix = '') {
    pathArgument(path);
    if (typeof suffix !== 'string') throw Object.assign(new TypeError('suffix must be a string'), { code: 'ERR_INVALID_ARG_TYPE' });
    let start = 0;
    let end = -1;
    let trailing = true;
    if (suffix.length > 0 && suffix.length <= path.length) {
      if (suffix === path) return '';
      let suffixIndex = suffix.length - 1;
      let componentEnd = -1;
      for (let index = path.length - 1; index >= 0; index--) {
        if (path[index] === '/') {
          if (!trailing) { start = index + 1; break; }
        } else {
          if (componentEnd === -1) { trailing = false; componentEnd = index + 1; }
          if (suffixIndex >= 0) {
            if (path[index] === suffix[suffixIndex]) {
              if (--suffixIndex === -1) end = index;
            } else { suffixIndex = -1; end = componentEnd; }
          }
        }
      }
      if (start === end) end = componentEnd;
      else if (end === -1) end = path.length;
      return path.slice(start, end);
    }
    for (let index = path.length - 1; index >= 0; index--) {
      if (path[index] === '/') {
        if (!trailing) { start = index + 1; break; }
      } else if (end === -1) { trailing = false; end = index + 1; }
    }
    return end === -1 ? '' : path.slice(start, end);
  }
  function parse(path: string): ParsedPath {
    pathArgument(path);
    const root = path[0] === '/' ? '/' : '';
    let end = path.length;
    while (end > 0 && path[end - 1] === '/') end--;
    if (!end) return { root, dir: root, base: '', ext: '', name: '' };
    const start = path.lastIndexOf('/', end - 1) + 1;
    const base = path.slice(start, end);
    // Node parse treats the root-level '..' component differently from extname.
    const ext = root && start === 1 && base === '..' ? '.' : paths.extname(base);
    return { root, dir: start > 0 ? path.slice(0, start - 1) || root : '', base, ext, name: base.slice(0, base.length - ext.length) };
  }
  function format(path: PathObject) {
    if (!path || typeof path !== 'object' || Array.isArray(path)) throw Object.assign(new TypeError('pathObject must be an object'), { code: 'ERR_INVALID_ARG_TYPE' });
    const dir = path.dir || path.root;
    const extension = path.ext || '';
    const base = path.base || `${path.name || ''}${extension && extension[0] !== '.' ? '.' : ''}${extension}`;
    if (!dir) return base;
    return dir === path.root ? `${dir}${base}` : `${dir}/${base}`;
  }
  const posix = {
    normalize(path: string) { pathArgument(path); return paths.normalize(path); },
    join: paths.join,
    resolve,
    relative(from: string, to: string) { pathArgument(from); pathArgument(to); return paths.relative(resolve(from), resolve(to)); },
    isAbsolute(path: string) { pathArgument(path); return paths.isAbsolute(path); },
    basename,
    dirname,
    extname(path: string) { pathArgument(path); return paths.extname(path); },
    parse,
    format,
    toNamespacedPath: <T>(path: T) => path,
    sep: '/',
    delimiter: ':',
  } as ScriptPath;
  const unsupported = () => { throw Object.assign(new Error('Windows path operations are not supported by the Vtron browser runtime; use POSIX virtual paths'), { code: 'ERR_NOT_SUPPORTED' }); };
  const win32 = Object.fromEntries(Object.keys(posix).filter(key => typeof posix[key as keyof ScriptPath] === 'function').map(key => [key, unsupported])) as unknown as ScriptPath;
  Object.assign(win32, { sep: '\\', delimiter: ';', posix, win32 });
  Object.assign(posix, { posix, win32 });
  return posix;
}
