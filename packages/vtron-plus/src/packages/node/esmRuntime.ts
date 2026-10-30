import { dirname } from 'vtron';
import type { ScriptModuleContext } from './ScriptModule';
import { TraceMap, originalPositionFor, type SourceMapInput } from '@jridgewell/trace-mapping';

type Namespace = Record<string, unknown>;
type Export = (name: string | Namespace, value?: unknown) => unknown;
type Declaration = { setters?: ((namespace: Namespace) => void)[]; execute?: () => unknown };
type Registration = [string[], (publish: Export, context: unknown) => Declaration, unknown?];
type ModuleSystem = {
  import(request: string, parent?: string, meta?: unknown): Promise<Namespace>;
  resolve(request: string, parent?: string, meta?: unknown): string;
  instantiate(id: string, parent?: string, meta?: unknown): Registration | Promise<Registration>;
  createContext(id: string): Record<string, unknown>;
  prepareImport(): void;
  entries(): IterableIterator<[string, Namespace]>;
  delete(id: string): unknown;
};
type ImportAttribute = { key: { name?: string; value?: string }; value: { value?: unknown } };
type BabelNode = {
  type: string;
  callee?: { type?: string };
  arguments?: unknown[];
  source?: { value?: string };
  options?: unknown;
  attributes?: ImportAttribute[];
  assertions?: ImportAttribute[];
};
type BabelPath = { node: BabelNode; replaceWith(node: unknown): void };
type BabelTypes = { identifier(name: string): unknown; callExpression(callee: unknown, args: unknown[]): unknown };
type BabelApi = {
  transform(source: string, options: Record<string, unknown>): { code?: string | null; map?: SourceMapInput | null };
};
type Tools = { babel: BabelApi; ModuleSystem: new () => ModuleSystem };
let toolsPromise: Promise<Tools> | undefined;
const nativeImport = new Function('specifier', 'options', 'return import(specifier, options);') as (specifier: string, options?: unknown) => Promise<Namespace>;

/** Keep the library's browser globals private; each script gets its own module registry. */
async function tools(): Promise<Tools> {
  if (!toolsPromise) toolsPromise = (async () => {
    const [babelModule, runtimeModule] = await Promise.all([
      import('@babel/standalone'),
      import('systemjs/dist/system.min.js?raw'),
    ]);
    const exported = babelModule as unknown as Partial<BabelApi> & { default?: BabelApi };
    const babel = (typeof exported.transform === 'function' ? exported : exported.default) as BabelApi;
    if (typeof babel?.transform !== 'function') throw new Error('无法初始化 ESM 编译器');
    const scope: Record<string, unknown> = {};
    const load = new Function('self', 'window', 'global', 'globalThis', 'document', 'location', runtimeModule.default + '\n;return self.System;');
    const system = load(scope, scope, scope, scope, undefined, undefined) as ModuleSystem;
    if (!system || typeof system.import !== 'function') throw new Error('无法初始化 ESM 模块加载器');
    return { babel, ModuleSystem: system.constructor as new () => ModuleSystem };
  })().catch(error => { toolsPromise = undefined; throw error; });
  return toolsPromise;
}

export interface EsmRuntimeOptions {
  context: ScriptModuleContext;
  resolve(request: string, parent: string): string;
  source(filename: string): string | undefined;
  isESM(filename: string): boolean;
  loadCommonJS(filename: string): unknown;
  builtin(request: string): unknown;
  toFileURL(path: string): string;
  fromFileURL(url: string): string;
}

function moduleError(code: string, message: string, path?: string) { return Object.assign(new Error(message), { code, path }); }
function pathError(error: unknown, filename: string, source?: string) {
  if (error && typeof error === 'object') {
    if (!('path' in error)) Object.assign(error, { path: filename });
    if (source !== undefined && !('scriptSource' in error)) Object.assign(error, { scriptSource: { filename, code: source, stackOffset: 2 } });
  }
  return error;
}
function sourceBody(source: string) {
  return source.replace(/^\uFEFF/, '').replace(/^#![^\r\n]*/, line => ' '.repeat(line.length));
}
function debugURL(filename: string) { return 'vtron://esm/' + filename.replace(/^\//, '').split('/').map(encodeURIComponent).join('/'); }
function isNativeURL(id: string) { return /^(?:https?:|data:)/i.test(id); }
function importName(value: unknown) {
  if (typeof value === 'string') return value;
  if (value instanceof URL) return value.href;
  throw new TypeError('import() 的模块地址必须是字符串或 URL');
}

export async function createEsmRuntime(options: EsmRuntimeOptions) {
  const { babel, ModuleSystem: System } = await tools();
  const { context } = options;
  const entry = context.filename.startsWith('/') ? context.filename : context.cwd.replace(/\/$/, '') + '/[eval]';
  const engine = new System();
  const overrides = new Map<string, string>();
  const compiled = new Map<string, Registration>();
  const sourceMaps = new Map<string, { filename: string; source: string; map: TraceMap }>();
  const loadedIds = new Set<string>();
  let disposed = false;

  function active() {
    if (disposed || context.signal?.aborted) throw Object.assign(new Error('ESM 脚本已中断'), { name: 'AbortError', code: 'ABORT_ERR' });
  }
  function sourceError(error: unknown, filename: string, source: string) {
    if (!(error instanceof Error) || !error.stack) return pathError(error, filename, source);
    const detail = error as Error & { scriptSource?: { filename: string; code: string; stackOffset: number; position?: { line: number; column: number } } };
    // Function constructor frames include two wrapper lines. Babel can also move
    // statements while hoisting declarations, so use its map rather than line offsets.
    error.stack = error.stack.replace(/(vtron:\/\/esm\/[^\s()]+?):(\d+):(\d+)/g, (frame, url: string, line: string, column: string) => {
      const item = sourceMaps.get(url);
      const generatedLine = Number(line) - 2;
      if (!item || generatedLine < 1) return frame;
      const mapped = originalPositionFor(item.map, { line: generatedLine, column: Math.max(0, Number(column) - 1) });
      if (mapped.line === null || mapped.column === null) return frame;
      detail.scriptSource ??= { filename: item.filename, code: item.source, stackOffset: 2 };
      if (detail.scriptSource?.filename === item.filename && !detail.scriptSource.position) {
        detail.scriptSource.position = { line: mapped.line, column: mapped.column + 1 };
      }
      return `${item.filename}:${mapped.line}:${mapped.column + 1}`;
    });
    return pathError(error, filename, source);
  }
  function resolved(request: string, parent = entry): string {
    active();
    request = importName(request);
    if (isNativeURL(request)) return request;
    if (request.startsWith('file:')) request = options.fromFileURL(request);
    else if (/^[A-Za-z][\w+.-]*:/.test(request) && !request.startsWith('node:')) throw moduleError('ERR_UNSUPPORTED_ESM_URL_SCHEME', `不支持此 ESM 模块地址：${request}`, parent);
    if (parent.startsWith('file:')) parent = options.fromFileURL(parent);
    return options.resolve(request, parent);
  }
  function publicURL(id: string) { return id.startsWith('/') ? options.toFileURL(id) : isNativeURL(id) || id.startsWith('node:') ? id : 'node:' + id; }
  function validateMeta(id: string, meta: unknown) {
    if (meta !== undefined && (meta === null || typeof meta !== 'object')) throw new TypeError('import() 的选项必须是对象');
    const value = meta as { with?: Record<string, unknown>; assert?: Record<string, unknown> } | undefined;
    const attributes = value?.with ?? value?.assert;
    if (attributes !== undefined && (attributes === null || typeof attributes !== 'object')) throw new TypeError('import 属性必须是对象');
    for (const name of Object.keys(attributes || {})) if (name !== 'type') throw moduleError('ERR_IMPORT_ATTRIBUTE_UNSUPPORTED', `不支持 import 属性 ${name}`, id);
    const type = attributes?.type;
    if (type !== undefined && type !== 'json') throw moduleError('ERR_IMPORT_ATTRIBUTE_UNSUPPORTED', `不支持 import 属性 type=${String(type)}`, id);
    if (type === 'json' && !isNativeURL(id) && !id.endsWith('.json')) throw moduleError('ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE', `JSON import 属性与文件类型不匹配：${id}`, id);
  }
  // Preserve import options, which the SystemJS Babel transform otherwise drops.
  function dynamicImports({ types }: { types: BabelTypes }) {
    return { visitor: {
      CallExpression(path: BabelPath) {
        if (path.node.callee?.type === 'Import') path.replaceWith(types.callExpression(types.identifier('__vtronImport'), path.node.arguments || []));
      },
      ImportExpression(path: BabelPath) {
        path.replaceWith(types.callExpression(types.identifier('__vtronImport'), [path.node.source, ...(path.node.options ? [path.node.options] : [])]));
      },
    } };
  }
  function staticAttributes(filename: string, metadata: Map<string, unknown>) {
    function check(path: BabelPath) {
      const attributes = path.node.attributes || path.node.assertions;
      if (!attributes?.length) return;
      const values: Record<string, unknown> = Object.create(null);
      for (const attribute of attributes) values[attribute.key.name || attribute.key.value || ''] = attribute.value.value;
      const request = path.node.source?.value || '';
      const meta = { with: values };
      validateMeta(resolved(request, filename), meta);
      metadata.set(request, meta);
    }
    return () => ({ visitor: { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check } });
  }
  function synthetic(value: () => unknown, commonJS: boolean): Registration {
    return [[], publish => ({ execute() {
      active();
      const exported = value();
      const namespace: Namespace = Object.create(null);
      if (commonJS) {
        namespace.default = exported;
        if (exported && (typeof exported === 'object' || typeof exported === 'function')) {
          for (const key of Object.keys(exported)) if (key !== 'default' && key !== '__esModule') namespace[key] = (exported as Namespace)[key];
        }
      } else if (exported && typeof exported === 'object') Object.assign(namespace, exported);
      publish(namespace);
    } })];
  }
  function guardRegistration(registration: Registration, filename: string, source: string): Registration {
    const declare = registration[1];
    return [registration[0], (publish, moduleContext) => {
      active();
      let declaration: Declaration;
      try { declaration = declare(publish, moduleContext); }
      catch (error) { throw sourceError(error, filename, source); }
      const execute = declaration.execute;
      if (execute) declaration.execute = function () {
        active();
        try {
          const result = execute.call(this);
          if (result && typeof (result as Promise<unknown>).then === 'function') return Promise.resolve(result).then(value => { active(); return value; }, error => { throw sourceError(error, filename, source); });
          return result;
        } catch (error) { throw sourceError(error, filename, source); }
      };
      return declaration;
    }, registration[2]];
  }
  function compile(source: string, filename: string): Registration {
    active();
    const existing = compiled.get(filename); if (existing) return existing;
    const metadata = new Map<string, unknown>();
    let result: ReturnType<BabelApi['transform']>;
    try {
      result = babel.transform(sourceBody(source), {
        filename, sourceType: 'module', babelrc: false, configFile: false, retainLines: true,
        sourceMaps: 'both', sourceFileName: options.toFileURL(filename),
        parserOpts: { plugins: ['deprecatedImportAssert'] },
        plugins: [dynamicImports, staticAttributes(filename, metadata), 'transform-modules-systemjs'],
      });
    } catch (error) { throw pathError(error, filename, source); }
    if (!result.code) throw moduleError('ERR_MODULE_COMPILE', `ESM 编译没有生成内容：${filename}`, filename);
    if (result.map) sourceMaps.set(debugURL(filename), { filename, source, map: new TraceMap(result.map) });
    let registration: Registration | undefined;
    const registrar = { register(dependencies: string[], declare: Registration[1], metas?: unknown) { registration = [dependencies, declare, metas]; } };
    const globals = context.globals;
    try {
      const evaluate = new Function('System', 'fs', 'process', 'console', 'fetch', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', '__vtronImport', 'global', 'globalThis', 'Buffer', result.code + '\n//# sourceURL=' + debugURL(filename));
      evaluate(registrar, globals.fs, globals.process, globals.console, globals.fetch, globals.setTimeout, globals.setInterval, globals.clearTimeout, globals.clearInterval, (request: string, meta?: unknown) => importModule(request, filename, meta), globals.global, globals.global, globals.Buffer);
    } catch (error) { throw sourceError(error, filename, source); }
    if (!registration) throw moduleError('ERR_MODULE_COMPILE', `ESM 模块未注册：${filename}`, filename);
    registration[2] = registration[0].map(request => metadata.get(request));
    const guarded = guardRegistration(registration, filename, source);
    compiled.set(filename, guarded);
    return guarded;
  }

  // Nothing in this loader is fetched through SystemJS's document/import-map machinery.
  engine.prepareImport = () => { active(); };
  engine.resolve = resolved;
  engine.createContext = id => ({
    url: publicURL(id), filename: id, dirname: dirname(id), main: id === entry,
    resolve: (request: string, parent?: string) => publicURL(resolved(request, parent || id)),
  });
  engine.instantiate = async (id, _parent, meta) => {
    active(); validateMeta(id, meta);
    loadedIds.add(id);
    if (isNativeURL(id)) {
      const namespace = await nativeImport(id, meta);
      active();
      return synthetic(() => namespace, false);
    }
    if (!id.startsWith('/')) return synthetic(() => options.builtin(id), true);
    const source = overrides.get(id) ?? options.source(id);
    if (source === undefined) throw moduleError('MODULE_NOT_FOUND', `找不到 ESM 模块：${id}`, id);
    if (id.endsWith('.json')) {
      return synthetic(() => {
        try { return { default: JSON.parse(source.replace(/^\uFEFF/, '')) }; }
        catch (error) { throw pathError(error, id, source); }
      }, false);
    }
    return options.isESM(id) || overrides.has(id) ? compile(source, id) : synthetic(() => options.loadCommonJS(id), true);
  };
  const systemImport = engine.import.bind(engine);
  engine.import = (request, parent, meta) => {
    const promise = (async () => {
      active();
      const id = resolved(request, parent);
      validateMeta(id, meta);
      if (isNativeURL(id)) {
        const namespace = await nativeImport(id, meta);
        active();
        return namespace;
      }
      const namespace = await systemImport(id, parent, meta);
      active();
      return namespace;
    })();
    const tracker = context as ScriptModuleContext & { track?: <T>(promise: Promise<T>) => Promise<T> };
    return tracker.track ? tracker.track(promise) : promise;
  };
  function importModule(request: string, parent = entry, meta?: unknown): Promise<Namespace> { return engine.import(importName(request), parent, meta); }

  function transformCommonJS(source: string, filename: string) {
    active();
    try {
      const result = babel.transform(sourceBody(source), {
        filename, sourceType: 'unambiguous', babelrc: false, configFile: false, retainLines: true,
        parserOpts: { allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true },
        plugins: [dynamicImports],
      });
      return result.code || source;
    } catch (error) { throw pathError(error, filename); }
  }

  return {
    importModule, transformCommonJS,
    async executeEntry(source: string) {
      active(); overrides.set(entry, source);
      await importModule(entry);
    },
    dispose() {
      disposed = true;
      for (const id of loadedIds) engine.delete(id);
      overrides.clear(); compiled.clear(); sourceMaps.clear(); loadedIds.clear();
    },
  };
}
