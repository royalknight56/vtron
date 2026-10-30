import { dirname } from 'vtron';
import { compileScopedFunction } from './scriptScope';
import type { ScriptModuleContext } from './ScriptModule';
import { TraceMap, originalPositionFor, type SourceMapInput } from '@jridgewell/trace-mapping';

import { createEsmModuleGraph, type Namespace, type Registration, type ModuleDefinition } from './esmModuleGraph';
type Declaration = ReturnType<Registration[1]>;
type ImportAttribute = { key: { name?: string; value?: string }; value: { value?: unknown } };
type BabelNode = {
  type: string;
  callee?: { type?: string };
  arguments?: unknown[];
  source?: { value?: string };
  options?: unknown;
  attributes?: ImportAttribute[];
  assertions?: ImportAttribute[];
  await?: boolean;
};
type BabelPath = { node: BabelNode; replaceWith(node: unknown): void; getFunctionParent(): unknown };
type BabelTypes = { identifier(name: string): unknown; callExpression(callee: unknown, args: unknown[]): unknown };
type BabelApi = {
  transform(source: string, options: Record<string, unknown>): { code?: string | null; map?: SourceMapInput | null };
};
let toolsPromise: Promise<BabelApi> | undefined;
const nativeImport = new Function('specifier', 'options', 'return import(specifier, options);') as (specifier: string, options?: unknown) => Promise<Namespace>;

async function tools(): Promise<BabelApi> {
  if (!toolsPromise) toolsPromise = import('@babel/standalone').then(babelModule => {
    const exported = babelModule as unknown as Partial<BabelApi> & { default?: BabelApi };
    const babel = (typeof exported.transform === 'function' ? exported : exported.default) as BabelApi;
    if (typeof babel?.transform !== 'function') throw new Error('无法初始化 ESM 编译器');
    return babel;
  }).catch(error => { toolsPromise = undefined; throw error; });
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
  const babel = await tools();
  const { context } = options;
  const entry = context.filename.startsWith('/') ? context.filename : context.cwd.replace(/\/$/, '') + '/[eval]';
  const overrides = new Map<string, string>();
  const compiled = new Map<string, ModuleDefinition>();
  const sourceMaps = new Map<string, { filename: string; source: string; map: TraceMap }>();
  const nativeMeta = new Map<string, unknown>();
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
    const id = options.resolve(request, parent);
    return id;
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
    if (isNativeURL(id) && meta !== undefined) nativeMeta.set(id, meta);
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
  function compile(source: string, filename: string): ModuleDefinition {
    active();
    const existing = compiled.get(filename); if (existing) return existing;
    const metadata = new Map<string, unknown>();
    let asynchronous = false;
    const detectAwait = () => ({ visitor: {
      AwaitExpression(path: BabelPath) { if (!path.getFunctionParent()) asynchronous = true; },
      ForOfStatement(path: BabelPath) { if (path.node.await && !path.getFunctionParent()) asynchronous = true; },
    } });
    // Babel's System.register transform recognizes AwaitExpression, but misses
    // a module whose only async syntax is top-level `for await`. Mark the
    // generated execute function in the AST, without rewriting source text.
    const asyncExecute = () => ({ visitor: { Program: { exit(path: BabelPath) {
      if (!asynchronous) return;
      type Statement = { type: string; argument?: { properties: { key: { name: string }; value: { type: string; async: boolean } }[] }; expression?: { callee?: { object?: { name?: string }; property?: { name?: string } }; arguments?: [unknown, { body: { body: Statement[] } }] } };
      const statements = (path.node as unknown as { body: Statement[] }).body;
      const call = statements.find(item => item.expression?.callee?.object?.name === 'System' && item.expression.callee.property?.name === 'register')?.expression;
      const body = call?.arguments?.[1].body.body;
      const execute = body?.find(item => item.type === 'ReturnStatement')?.argument?.properties.find(item => item.key.name === 'execute')?.value;
      if (!execute || execute.type !== 'FunctionExpression') throw moduleError('ERR_MODULE_COMPILE', `Cannot locate asynchronous module execution: ${filename}`, filename);
      execute.async = true;
    } } } });
    let result: ReturnType<BabelApi['transform']>;
    try {
      result = babel.transform(sourceBody(source), {
        filename, sourceType: 'module', babelrc: false, configFile: false, retainLines: true,
        sourceMaps: 'both', sourceFileName: options.toFileURL(filename),
        parserOpts: { plugins: ['deprecatedImportAssert'] },
        plugins: [detectAwait, dynamicImports, staticAttributes(filename, metadata), 'transform-modules-systemjs', asyncExecute],
      });
    } catch (error) { throw pathError(error, filename, source); }
    if (!result.code) throw moduleError('ERR_MODULE_COMPILE', `ESM 编译没有生成内容：${filename}`, filename);
    if (result.map) sourceMaps.set(debugURL(filename), { filename, source, map: new TraceMap(result.map) });
    let registration: Registration | undefined;
    const registrar = { register(dependencies: string[], declare: Registration[1], metas?: unknown) { registration = [dependencies, declare, metas]; } };
    const globals = context.globals;
    try {
      const evaluate = compileScopedFunction(globals.global, ['System', 'fs', 'process', 'console', 'fetch', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', '__vtronImport', 'global', 'globalThis', 'Buffer'], result.code + '\n//# sourceURL=' + debugURL(filename));
      evaluate(registrar, globals.fs, globals.process, globals.console, globals.fetch, globals.setTimeout, globals.setInterval, globals.clearTimeout, globals.clearInterval, (request: string, meta?: unknown) => importModule(request, filename, meta), globals.global, globals.global, globals.Buffer);
    } catch (error) { throw sourceError(error, filename, source); }
    if (!registration) throw moduleError('ERR_MODULE_COMPILE', `ESM 模块未注册：${filename}`, filename);
    registration[2] = registration[0].map(request => metadata.get(request));
    const guarded = { registration: guardRegistration(registration, filename, source), async: asynchronous };
    compiled.set(filename, guarded);
    return guarded;
  }

  const graph = createEsmModuleGraph({
    active, resolve: resolved, validate: validateMeta,
    context: id => ({
      url: publicURL(id), filename: id, dirname: dirname(id), main: id === entry,
      resolve: (request: string, parent?: string) => publicURL(resolved(request, parent || id)),
      import: (request: string, meta?: unknown) => importModule(request, id, meta),
      meta: {
        url: publicURL(id), filename: id, dirname: dirname(id), main: id === entry,
        resolve: (request: string) => publicURL(resolved(request, id)),
      },
    }),
    definition(id) {
      active();
      if (isNativeURL(id)) return { async: true, registration: [[], publish => ({ async execute() { const namespace = await nativeImport(id, nativeMeta.get(id)); active(); publish(namespace); } })] };
      if (!id.startsWith('/')) return { async: false, registration: synthetic(() => options.builtin(id), true) };
      const source = overrides.get(id) ?? options.source(id);
      if (source === undefined) throw moduleError('MODULE_NOT_FOUND', `找不到 ESM 模块：${id}`, id);
      if (id.endsWith('.json')) return { async: false, registration: synthetic(() => {
        try { return { default: options.loadCommonJS(id) }; }
        catch (error) { throw pathError(error, id, source); }
      }, false) };
      return options.isESM(id) || overrides.has(id) ? compile(source, id) : { async: false, registration: synthetic(() => options.loadCommonJS(id), true) };
    },
  });
  function importModule(request: string, parent = entry, meta?: unknown): Promise<Namespace> {
    const promise = Promise.resolve().then(() => {
      active();
      const id = resolved(importName(request), parent);
      validateMeta(id, meta);
      return graph.import(id);
    });
    return context.track ? context.track(promise) : promise;
  }

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
    requireModule(filename: string) { active(); return graph.require(filename); },
    async executeEntry(source: string) {
      active(); overrides.set(entry, source);
      await importModule(entry);
    },
    dispose() {
      disposed = true;
      graph.dispose();
      overrides.clear(); compiled.clear(); sourceMaps.clear(); nativeMeta.clear();
    },
  };
}
