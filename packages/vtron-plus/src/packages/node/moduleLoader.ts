import { basename, dirname, extname, join, resolve, type System } from 'vtron';
import type { ScriptModuleContext, ScriptModuleResolver } from './ScriptModule';
import { scriptPathToFileURL, scriptFileURLToPath } from './scriptURL';

const MAX_FILES = 8192;
const MAX_BYTES = 32 * 1024 * 1024;
const MAX_DEPTH = 64;
const MAX_ENTRIES = 32768;
const sourceExtensions = new Set(['.js', '.cjs', '.mjs', '.json']);
const builtinNames = new Set(['fs', 'fs/promises', 'process', 'path', 'path/posix', 'path/win32', 'os', 'timers/promises', 'util', 'readline', 'readline/promises', 'url', 'module', 'perf_hooks', 'crypto', 'worker_threads', 'child_process', 'dns', 'dns/promises', 'net', 'http', 'tty', 'buffer', 'assert', 'assert/strict', 'events', 'querystring', 'v8', 'https', 'http2', 'tls', 'stream', 'stream/promises', 'zlib', 'inspector', 'vm']);
type EsmRuntime = Awaited<ReturnType<(typeof import('./esmRuntime'))['createEsmRuntime']>>;
type TransformedModule = { ok: true; code: string } | { ok: false; error: unknown };
type ResolveMode = 'require' | 'import';
const dynamicImportCandidate = /\bimport(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\(/;
type PackageJson = { name?: string; type?: string; main?: string; exports?: unknown; imports?: unknown };
type CommonJSRequire = ((request: string) => unknown) & {
  main: unknown;
  cache: Record<string, CommonJSModule>;
  resolve: (request: string) => string;
};
type CommonJSModule = {
  id: string;
  filename: string;
  path: string;
  exports: unknown;
  loaded: boolean;
  parent: CommonJSModule | null;
  children: CommonJSModule[];
  paths?: string[];
  require?: CommonJSRequire;
};

function moduleError(code: string, message: string, path?: string) { return Object.assign(new Error(message), { code, path }); }
function inside(parent: string, path: string) { return parent === '/' || path === parent || path.startsWith(parent + '/'); }
function abort(signal?: AbortSignal) {
  if (signal?.aborted) throw Object.assign(new Error('The operation was aborted'), { name: 'AbortError', code: 'ABORT_ERR' });
}
function ancestors(path: string) {
  const result: string[] = [];
  for (let current = path; ; current = dirname(current)) { result.push(current); if (current === '/') return result; }
}
function nodeModulePaths(parent: string) { return ancestors(parent).filter(path => basename(path) !== 'node_modules').map(path => join(path, 'node_modules')); }
function parseJson(source: string, filename: string): unknown {
  try { return JSON.parse(source.replace(/^\uFEFF/, '')); }
  catch (error) { throw moduleError('ERR_INVALID_PACKAGE_CONFIG', `Invalid JSON in ${filename}: ${String(error)}`, filename); }
}

/** Read text modules once, then provide Node-style synchronous require over that snapshot. */
export function createNodeModuleLoader(system: System) {
  return async (context: ScriptModuleContext): Promise<ScriptModuleResolver> => {
    const isEvalEntry = !context.filename.startsWith('/');
    const entry = isEvalEntry ? join(context.cwd, '[eval]') : resolve(context.filename);
    const entryDirectory = dirname(entry);
    const files = new Map<string, string>();
    const knownFiles = new Set<string>();
    const directories = new Set<string>();
    const packages = new Map<string, PackageJson>();
    const scanned = new Set<string>();
    const cache: Record<string, CommonJSModule> = Object.create(null);
    const resolutions = new Map<string, string>();
    const transformed = new Map<string, TransformedModule>();
    let disposed = false;
    let esmRuntime: EsmRuntime | undefined;
    let esmPromise: Promise<EsmRuntime> | undefined;
    let bytes = 0;
    let fileCount = 0;
    let entryCount = 0;

    function active() {
      if (disposed) throw Object.assign(new Error('模块运行时已释放'), { name: 'AbortError', code: 'ABORT_ERR' });
      abort(context.signal);
    }

    async function rememberFile(path: string) {
      if (knownFiles.has(path)) return;
      knownFiles.add(path);
      if (!sourceExtensions.has(extname(path)) && basename(path) !== 'index' && path !== entry) return;
      if (++fileCount > MAX_FILES) throw moduleError('ERR_MODULE_SNAPSHOT_LIMIT', `模块预读超过 ${MAX_FILES} 个文件，请缩小项目目录或依赖规模`);
      abort(context.signal);
      const source = await system.fs.readFile(path);
      if (source === null) { knownFiles.delete(path); return; }
      bytes += new TextEncoder().encode(source).byteLength;
      if (bytes > MAX_BYTES) throw moduleError('ERR_MODULE_SNAPSHOT_LIMIT', '模块预读超过 32 MB，请缩小项目目录或依赖规模');
      files.set(path, source);
    }
    async function walk(path: string, dependencies: boolean, depth = 0) {
      abort(context.signal);
      if (scanned.has(path)) return;
      if (depth > MAX_DEPTH) throw moduleError('ERR_MODULE_SNAPSHOT_LIMIT', '模块目录层级过深');
      scanned.add(path); directories.add(path);
      for (const item of await system.fs.readdir(path)) {
        abort(context.signal);
        if (++entryCount > MAX_ENTRIES) throw moduleError('ERR_MODULE_SNAPSHOT_LIMIT', '模块目录包含过多条目，请缩小项目目录或依赖规模');
        if (item.isSymlink || item.name.startsWith('.')) continue;
        if (item.isDirectory) {
          if (item.name === 'node_modules' && !dependencies) continue;
          // A filesystem-root project must never turn module preloading into a disk scan.
          if (path === '/' && !dependencies) continue;
          await walk(item.path, dependencies, depth + 1);
        } else if (item.isFile) await rememberFile(item.path);
      }
    }

    // Read package scopes without reading user configuration or arbitrary files on the way up.
    let projectRoot = entryDirectory;
    let foundProject = false;
    for (const path of ancestors(entryDirectory)) {
      abort(context.signal); directories.add(path);
      const manifestPath = join(path, 'package.json');
      if ((await system.fs.stat(manifestPath))?.isFile) {
        await rememberFile(manifestPath);
        if (!foundProject) { projectRoot = path; foundProject = true; }
      }
    }
    await walk(projectRoot, false);
    for (const path of nodeModulePaths(entryDirectory)) {
      abort(context.signal);
      if ((await system.fs.stat(path))?.isDirectory) await walk(path, true);
    }
    abort(context.signal);

    // Bin entries may have no suffix, and node -e has no physical source file.
    if (context.source !== undefined) {
      const previous = files.get(entry);
      if (previous === undefined && ++fileCount > MAX_FILES) throw moduleError('ERR_MODULE_SNAPSHOT_LIMIT', `模块预读超过 ${MAX_FILES} 个文件，请缩小项目目录或依赖规模`);
      bytes += new TextEncoder().encode(context.source).byteLength - (previous === undefined ? 0 : new TextEncoder().encode(previous).byteLength);
      if (bytes > MAX_BYTES) throw moduleError('ERR_MODULE_SNAPSHOT_LIMIT', '模块预读超过 32 MB，请缩小项目目录或依赖规模');
      files.set(entry, context.source); knownFiles.add(entry);
    }

    function packageAt(path: string): PackageJson | undefined {
      const filename = join(path, 'package.json');
      const source = files.get(filename);
      if (source === undefined) return undefined;
      if (!packages.has(path)) {
        const value = parseJson(source, filename);
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw moduleError('ERR_INVALID_PACKAGE_CONFIG', `package.json 必须是对象：${filename}`, filename);
        packages.set(path, value as PackageJson);
      }
      return packages.get(path);
    }
    function packageScope(filename: string) {
      for (const path of ancestors(dirname(filename))) {
        if (basename(path) === 'node_modules') break;
        const manifest = packageAt(path);
        if (manifest) return { root: path, manifest };
      }
      return undefined;
    }
    function asFile(path: string): string | undefined {
      if (knownFiles.has(path)) return path;
      return ['.js', '.cjs', '.json', '.mjs', '.node'].map(extension => path + extension).find(candidate => knownFiles.has(candidate));
    }
    function asPath(path: string, seen = new Set<string>()): string | undefined {
      const file = asFile(path); if (file) return file;
      if (!directories.has(path) || seen.has(path)) return undefined;
      seen.add(path);
      const manifest = packageAt(path);
      if (typeof manifest?.main === 'string' && manifest.main) {
        const main = resolve(path, manifest.main);
        if (!inside(path, main)) throw moduleError('ERR_INVALID_PACKAGE_TARGET', `package.json main 不能指向包目录之外：${path}`, path);
        const target = asPath(main, seen); if (target) return target;
      }
      return asFile(join(path, 'index'));
    }
    function missing(request: string, parent: string): never {
      throw moduleError('MODULE_NOT_FOUND', `Cannot find module '${request}' from '${parent}'。请先在项目目录运行 npm install；运行期间新建的模块需重新执行脚本后加载。`, parent);
    }
    function exportTarget(value: unknown, mode: ResolveMode, wildcard?: string): string | null | undefined {
      if (value === null) return null;
      if (typeof value === 'string') return wildcard === undefined ? value : value.replace(/\*/g, wildcard);
      if (Array.isArray(value)) {
        for (const candidate of value) { const result = exportTarget(candidate, mode, wildcard); if (result !== undefined && result !== null) return result; }
        return undefined;
      }
      if (value && typeof value === 'object') {
        for (const [condition, candidate] of Object.entries(value)) {
          if (condition === mode || condition === 'node' || condition === 'default') {
            const result = exportTarget(candidate, mode, wildcard); if (result !== undefined) return result;
          }
        }
      }
      return undefined;
    }
    function packageExport(root: string, manifest: PackageJson, subpath: string, request: string, parent: string, mode: ResolveMode): string {
      const exported = manifest.exports;
      let target: string | null | undefined;
      if (exported && typeof exported === 'object' && !Array.isArray(exported) && Object.keys(exported).some(key => key.startsWith('.'))) {
        const map = exported as Record<string, unknown>;
        if (Object.prototype.hasOwnProperty.call(map, subpath)) target = exportTarget(map[subpath], mode);
        else {
          const matches = Object.keys(map).filter(key => key.startsWith('./') && key.includes('*')).map(key => {
            const [prefix, suffix] = key.split('*');
            return { key, prefix, suffix };
          }).filter(({ prefix, suffix }) => subpath.startsWith(prefix) && subpath.endsWith(suffix) && subpath.length >= prefix.length + suffix.length)
            .sort((a, b) => b.prefix.length - a.prefix.length || b.suffix.length - a.suffix.length);
          if (matches[0]) { const { key, prefix, suffix } = matches[0]; target = exportTarget(map[key], mode, subpath.slice(prefix.length, suffix ? -suffix.length : undefined)); }
        }
      } else if (subpath === '.') target = exportTarget(exported, mode);
      if (typeof target !== 'string') throw moduleError('ERR_PACKAGE_PATH_NOT_EXPORTED', `Package subpath '${subpath}' is not exported for ${mode} by ${root}`, root);
      if (!target.startsWith('./') || target.slice(2).split('/').some(part => part === '..' || part === '.' || part === 'node_modules') || /[\\\0]/.test(target)) {
        throw moduleError('ERR_INVALID_PACKAGE_TARGET', `Invalid package exports target '${target}' in ${root}`, root);
      }
      const path = resolve(root, target);
      if (!inside(root, path) || !knownFiles.has(path)) return missing(request, parent);
      return path;
    }
    function packageImport(request: string, parent: string, mode: ResolveMode): string {
      if (request === '#' || request.startsWith('#/')) throw moduleError('ERR_INVALID_MODULE_SPECIFIER', `Invalid package import specifier '${request}'`, parent);
      const scope = packageScope(parent);
      const undefinedImport = (): never => { throw moduleError('ERR_PACKAGE_IMPORT_NOT_DEFINED', `Package import '${request}' is not defined for ${mode} in ${scope?.root || parent}`, parent); };
      const imported = scope?.manifest.imports;
      if (imported === undefined || imported === null) return undefinedImport();
      if (!imported || typeof imported !== 'object' || Array.isArray(imported)) throw moduleError('ERR_INVALID_PACKAGE_CONFIG', `package.json imports must be an object in ${scope!.root}`, scope!.root);
      const map = imported as Record<string, unknown>;
      let target: string | null | undefined;
      if (Object.prototype.hasOwnProperty.call(map, request)) target = exportTarget(map[request], mode);
      else {
        const matches = Object.keys(map).filter(key => key.startsWith('#') && key.split('*').length === 2).map(key => {
          const [prefix, suffix] = key.split('*');
          return { key, prefix, suffix };
        }).filter(({ prefix, suffix }) => request.startsWith(prefix) && request.endsWith(suffix) && request.length >= prefix.length + suffix.length)
          .sort((a, b) => b.prefix.length - a.prefix.length || b.suffix.length - a.suffix.length);
        if (matches[0]) { const { key, prefix, suffix } = matches[0]; target = exportTarget(map[key], mode, request.slice(prefix.length, suffix ? -suffix.length : undefined)); }
      }
      if (typeof target !== 'string') return undefinedImport();
      if (!target.startsWith('./')) throw moduleError('ERR_NOT_SUPPORTED', `Package import '${request}' targets '${target}'; only targets within the same package are supported`, scope!.root);
      if (target.slice(2).split('/').some(part => part === '..' || part === '.' || part === 'node_modules') || /[\\\0]/.test(target)) {
        throw moduleError('ERR_INVALID_PACKAGE_TARGET', `Invalid package imports target '${target}' in ${scope!.root}`, scope!.root);
      }
      if (/[?#%]/.test(target)) throw moduleError('ERR_NOT_SUPPORTED', `Package imports targets with URL query, fragment or percent encoding are not supported: '${target}'`, scope!.root);
      const path = resolve(scope!.root, target);
      if (!inside(scope!.root, path)) throw moduleError('ERR_INVALID_PACKAGE_TARGET', `Package imports target escapes its package: '${target}'`, scope!.root);
      if (!knownFiles.has(path)) throw moduleError('MODULE_NOT_FOUND', `Cannot find target '${target}' for package import '${request}' in ${scope!.root}`, path);
      return path;
    }
    function packageParts(request: string) {
      const parts = request.split('/');
      const count = request.startsWith('@') ? 2 : 1;
      if (parts.length < count || parts.some(part => !part || part === '.' || part === '..' || /[\\\0?#%:]/.test(part))) return undefined;
      if (request.startsWith('@') && parts[0].length < 2) return undefined;
      return { name: parts.slice(0, count).join('/'), subpath: parts.length === count ? '.' : './' + parts.slice(count).join('/') };
    }
    function isBuiltin(request: string) { return request.startsWith('node:') || builtinNames.has(request); }
    function parentPath(filename?: string) {
      if (filename?.startsWith('file:')) return scriptFileURLToPath(filename);
      return filename?.startsWith('/') ? resolve(filename) : entry;
    }
    function isESM(filename: string) {
      if (filename === entry && isEvalEntry) return false;
      const extension = extname(filename);
      if (extension === '.mjs') return true;
      return (extension === '.js' || !extension) && packageScope(filename)?.manifest.type === 'module';
    }
    const unsupportedLoader = (operation: string): never => { throw moduleError('ERR_NOT_SUPPORTED', `node:module ${operation} requires Node's module loader and is not supported by the Vtron browser runtime`); };
    class Module {
      constructor(..._args: unknown[]) { unsupportedLoader('Module construction'); }
      static register(..._args: unknown[]) { return unsupportedLoader('register'); }
      static registerHooks(..._args: unknown[]) { return unsupportedLoader('registerHooks'); }
    }
    const moduleBuiltin = {
      Module,
      register: Module.register,
      registerHooks: Module.registerHooks,
      builtinModules: [...builtinNames],
      createRequire(filename: string | URL) {
        const path = filename instanceof URL ? scriptFileURLToPath(filename) : typeof filename === 'string' && filename.startsWith('file:') ? scriptFileURLToPath(filename) : filename;
        if (typeof path !== 'string' || !path.startsWith('/')) throw moduleError('ERR_INVALID_ARG_VALUE', 'createRequire() 需要绝对路径或 file: URL');
        active();
        return makeRequire(resolve(path));
      },
    };
    function builtin(request: string): unknown {
      active();
      return request === 'module' || request === 'node:module' ? moduleBuiltin : context.requireBuiltin(request);
    }
    function resolveRequest(request: string, parentFilename?: string, mode: ResolveMode = 'require'): string {
      if (typeof request !== 'string' || !request || request.includes('\0')) throw new TypeError('模块名称必须是非空字符串');
      active();
      if (isBuiltin(request)) { builtin(request); return mode === 'import' && !request.startsWith('node:') ? 'node:' + request : request; }
      const parent = parentPath(parentFilename);
      const key = mode + '\0' + parent + '\0' + request;
      const cached = resolutions.get(key); if (cached) return cached;
      let resolved: string | undefined;
      if (request.startsWith('#')) {
        resolved = packageImport(request, parent, mode);
      } else if (request.startsWith('file:')) {
        resolved = asPath(scriptFileURLToPath(request));
      } else if (request === '.' || request === '..' || request.startsWith('./') || request.startsWith('../') || request.startsWith('/')) {
        resolved = asPath(resolve(dirname(parent), request));
      } else {
        const parts = packageParts(request); if (!parts) return missing(request, parent);
        const scope = packageScope(parent);
        if (scope?.manifest.name === parts.name && scope.manifest.exports !== undefined) resolved = packageExport(scope.root, scope.manifest, parts.subpath, request, parent, mode);
        else {
          for (const directory of nodeModulePaths(dirname(parent))) {
            const root = join(directory, parts.name);
            if (!directories.has(root)) continue;
            const manifest = packageAt(root);
            resolved = manifest?.exports !== undefined
              ? packageExport(root, manifest, parts.subpath, request, parent, mode)
              : asPath(parts.subpath === '.' ? root : resolve(root, parts.subpath));
            if (resolved) break;
          }
        }
      }
      if (!resolved) return missing(request, parent);
      resolutions.set(key, resolved);
      return resolved;
    }
    if (!isESM(entry) && context.main && typeof context.main === 'object') cache[entry] = context.main as CommonJSModule;

    function makeRequire(parent: string): CommonJSRequire {
      const require = ((request: string) => load(request, parent)) as CommonJSRequire;
      require.resolve = request => resolveRequest(request, parent);
      require.cache = cache;
      Object.defineProperty(require, 'main', { get: () => isESM(entry) ? undefined : context.main });
      return require;
    }
    function load(request: string, parentFilename?: string): unknown {
      active();
      if (typeof request === 'string' && isBuiltin(request)) return builtin(request);
      const filename = resolveRequest(request, parentFilename);
      if (cache[filename]) return cache[filename].exports;
      const extension = extname(filename);
      if (isESM(filename)) {
        throw moduleError('ERR_REQUIRE_ESM', `不能通过 require() 同步加载 ESM 模块，请使用 await import()：${filename}`, filename);
      }
      if (extension === '.node') throw moduleError('ERR_DLOPEN_FAILED', `浏览器不支持 Node 原生扩展：${filename}`, filename);
      const source = files.get(filename);
      if (source === undefined) throw moduleError('ERR_UNKNOWN_FILE_EXTENSION', `当前仅支持 .js、.cjs 和 .json 模块：${filename}`, filename);
      const parent = cache[parentPath(parentFilename)] || null;
      const module: CommonJSModule = { id: filename, filename, path: dirname(filename), exports: {}, loaded: false, parent, children: [], paths: nodeModulePaths(dirname(filename)) };
      module.require = makeRequire(filename);
      cache[filename] = module;
      parent?.children?.push(module);
      try {
        if (extension === '.json') module.exports = parseJson(source, filename);
        else {
          const result = transformed.get(filename);
          if (result && !result.ok) throw result.error;
          const code = (result?.code ?? source).replace(/^\uFEFF/, '').replace(/^#![^\r\n]*/, line => ' '.repeat(line.length));
          const globals = context.globals;
          const sourceURL = 'vtron://module/' + filename.replace(/^\//, '').split('/').map(encodeURIComponent).join('/');
          let evaluate: (...args: unknown[]) => unknown;
          try {
            // An outer binding lets local Buffer declarations shadow the global without
            // moving a module's "use strict" directive out of its function prologue.
            const factory = new Function('Buffer', 'return function(require, module, exports, __filename, __dirname, fs, process, console, fetch, setTimeout, setInterval, clearTimeout, clearInterval, __vtronImport, global, globalThis) {' + code + '\n}\n//# sourceURL=' + sourceURL);
            evaluate = factory(globals.Buffer) as typeof evaluate;
          } catch (error) {
            if (error instanceof SyntaxError) {
              if (/(?:^|[;\r\n])\s*(?:export\b|import\s*(?:['"{*]|[\w$]+\s+from\b))/.test(code)) {
                throw moduleError('ERR_REQUIRE_ESM', `无法作为 CommonJS 加载 ${filename}；ESM 文件请使用 .mjs 或在包中声明 "type": "module"，并使用 import 加载。${error.message}`, filename);
              }
              throw Object.assign(new SyntaxError(`${filename}: ${error.message}`), { code: 'ERR_MODULE_COMPILE', path: filename });
            }
            throw error;
          }
          evaluate.call(module.exports, module.require, module, module.exports, filename, dirname(filename), globals.fs, globals.process, globals.console, globals.fetch, globals.setTimeout, globals.setInterval, globals.clearTimeout, globals.clearInterval, (request: string, options?: unknown) => importModule(request, filename, options), globals.global, globals.global);
        }
        module.loaded = true;
        return module.exports;
      } catch (error) {
        delete cache[filename];
        if (parent?.children) parent.children = parent.children.filter(child => child !== module);
        throw error;
      }
    }

    function getEsmRuntime(): Promise<EsmRuntime> {
      active();
      if (!esmPromise) esmPromise = import('./esmRuntime').then(({ createEsmRuntime }) => {
        active();
        return createEsmRuntime({
          context,
          resolve: (request, parent) => resolveRequest(request, parent, 'import'),
          source: filename => { active(); return files.get(filename); },
          isESM,
          loadCommonJS: filename => load(filename),
          builtin,
          toFileURL: path => scriptPathToFileURL(path).href,
          fromFileURL: scriptFileURLToPath,
        });
      }).then(runtime => {
        if (disposed || context.signal?.aborted) { runtime.dispose(); active(); }
        esmRuntime = runtime;
        return runtime;
      });
      return esmPromise;
    }
    function importModule(request: string, parentFilename?: string, options?: unknown): Promise<unknown> {
      const promise = (async () => {
        const runtime = await getEsmRuntime();
        active();
        return runtime.importModule(request, parentPath(parentFilename), options);
      })();
      return context.track ? context.track(promise) : promise;
    }
    function dispose() {
      if (disposed) return;
      disposed = true;
      esmRuntime?.dispose();
      if (!esmRuntime && esmPromise) void esmPromise.then(runtime => runtime.dispose(), () => undefined);
      files.clear(); knownFiles.clear(); directories.clear(); packages.clear(); scanned.clear(); resolutions.clear(); transformed.clear();
      for (const filename of Object.keys(cache)) delete cache[filename];
    }
    const require = ((request: string, parentFilename?: string) => load(request, parentFilename)) as ScriptModuleResolver;
    require.resolve = resolveRequest; require.cache = cache;
    require.importModule = importModule;
    require.executeEntry = async source => {
      active();
      if (!isESM(entry)) return false;
      await (await getEsmRuntime()).executeEntry(source);
      return true;
    };
    require.transformEntry = source => {
      active();
      const result = transformed.get(entry);
      if (result && !result.ok) throw result.error;
      return result?.code ?? source;
    };
    require.dispose = dispose;

    try {
      // Synchronous require must have a compiler ready before executing dynamic imports.
      // A bad, unused candidate is retained as a per-file error until that file is loaded.
      const candidates: [string, string][] = [];
      for (const [filename, source] of files) {
        if (extname(filename) === '.json' || !dynamicImportCandidate.test(source)) continue;
        try { if (!isESM(filename)) candidates.push([filename, source]); }
        catch (error) { transformed.set(filename, { ok: false, error }); }
      }
      if (candidates.length) {
        const runtime = await getEsmRuntime();
        for (const [filename, source] of candidates) {
          active();
          try { transformed.set(filename, { ok: true, code: runtime.transformCommonJS(source, filename) }); }
          catch (error) { transformed.set(filename, { ok: false, error }); }
        }
      }
      active();
    } catch (error) { dispose(); throw error; }
    return require;
  };
}
