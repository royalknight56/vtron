export type Namespace = Record<string, unknown>;
export type Publish = (name: string | Namespace, value?: unknown) => unknown;
export type Registration = [string[], (publish: Publish, context: unknown) => { setters?: ((namespace: Namespace) => void)[]; execute?: () => unknown }, unknown?];
export type ModuleDefinition = { registration: Registration; async: boolean };
type RecordState = {
  id: string;
  state: 'new' | 'prepared' | 'evaluating' | 'evaluated' | 'failed';
  namespace: Namespace;
  target: Namespace;
  values: Namespace;
  definition?: ModuleDefinition;
  dependencies: RecordState[];
  subscribers: Set<(namespace: Namespace) => void>;
  promise?: Promise<Namespace>;
  requireNamespace?: Namespace;
  error?: unknown;
};
const error = (code: string, message: string, path: string) => Object.assign(new Error(message), { code, path });

/** One execution's ESM instances. No speculative source evaluation or second
 * CommonJS-transformed copy is used for synchronous require. */
export function createEsmModuleGraph(hooks: {
  active(): void;
  definition(id: string): ModuleDefinition;
  resolve(request: string, parent: string): string;
  validate(id: string, meta: unknown): void;
  context(id: string): unknown;
}) {
  const records = new Map<string, RecordState>();
  function get(id: string): RecordState {
    hooks.active();
    const existing = records.get(id);
    if (existing) return existing;
    const target = Object.create(null) as Namespace;
    Object.defineProperty(target, Symbol.toStringTag, { value: 'Module' });
    const namespace = new Proxy(target, { set: () => false, defineProperty: () => false, deleteProperty: () => false, setPrototypeOf: () => false });
    const record: RecordState = { id, state: 'new', target, namespace, values: Object.create(null), dependencies: [], subscribers: new Set() };
    records.set(id, record);
    return record;
  }
  function failed(record: RecordState, failure: unknown): never { record.state = 'failed'; record.error = failure; throw failure; }
  function prepare(record: RecordState, ancestors = new Set<string>()) {
    hooks.active();
    if (record.state === 'failed') throw record.error;
    // Babel's setter lowering cannot preserve lexical TDZ semantics across
    // cycles. Reject the graph before any module body has run.
    if (ancestors.has(record.id)) throw error('ERR_MODULE_CYCLE_UNSUPPORTED', `Cyclic ESM graphs are not supported: ${record.id}`, record.id);
    if (record.state !== 'new') return;
    try {
      ancestors.add(record.id);
      const definition = hooks.definition(record.id);
      record.definition = definition;
      record.dependencies = definition.registration[0].map((request, index) => {
        const id = hooks.resolve(request, record.id);
        hooks.validate(id, (definition.registration[2] as unknown[] | undefined)?.[index]);
        return get(id);
      });
      for (const dependency of record.dependencies) prepare(dependency, ancestors);
      record.state = 'prepared';
    } catch (failure) { return failed(record, failure); }
    finally { ancestors.delete(record.id); }
  }
  function asyncDependency(record: RecordState, seen = new Set<string>()): RecordState | undefined {
    if (seen.has(record.id)) return;
    seen.add(record.id);
    if (record.definition!.async) return record;
    for (const dependency of record.dependencies) { const found = asyncDependency(dependency, seen); if (found) return found; }
  }
  function publish(record: RecordState): Publish {
    return (name, value) => {
      hooks.active();
      let changed = false;
      const entries = typeof name === 'string' ? [[name, value] as const] : Object.entries(name);
      for (const [key, next] of entries) {
        const exists = Object.prototype.hasOwnProperty.call(record.values, key);
        if (exists && Object.is(record.values[key], next)) continue;
        if (!exists) Object.defineProperty(record.target, key, { enumerable: true, get: () => record.values[key] });
        record.values[key] = next; changed = true;
      }
      if (changed) for (const setter of record.subscribers) setter(record.namespace);
      return value;
    };
  }
  function execute(record: RecordState) {
    hooks.active();
    const declaration = record.definition!.registration[1](publish(record), hooks.context(record.id));
    for (const [index, dependency] of record.dependencies.entries()) {
      const setter = declaration.setters?.[index];
      if (setter) { dependency.subscribers.add(setter); setter(dependency.namespace); }
    }
    return declaration.execute?.call(undefined);
  }
  function complete(record: RecordState) {
    hooks.active();
    record.state = 'evaluated';
    Object.preventExtensions(record.target);
    return record.namespace;
  }
  function evaluateSync(record: RecordState): Namespace {
    hooks.active();
    if (record.state === 'failed') throw record.error;
    if (record.state === 'evaluated') return record.namespace;
    if (record.state === 'evaluating') throw error('ERR_REQUIRE_CYCLE_MODULE', `Cannot synchronously require an evaluating module: ${record.id}`, record.id);
    record.state = 'evaluating';
    try {
      for (const dependency of record.dependencies) evaluateSync(dependency);
      const result = execute(record);
      if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
        void Promise.resolve(result).catch(() => {});
        throw error('ERR_REQUIRE_ASYNC_MODULE', `Module evaluation is asynchronous: ${record.id}`, record.id);
      }
      return complete(record);
    } catch (failure) { return failed(record, failure); }
  }
  function evaluateAsync(record: RecordState): Promise<Namespace> {
    if (record.state === 'failed') return Promise.reject(record.error);
    if (record.state === 'evaluated') return Promise.resolve(record.namespace);
    if (record.promise) return record.promise;
    // Install the promise before running any module body. Walk synchronous
    // dependencies immediately, in source order; suspend only at real async
    // work, allowing later siblings to start while that work is pending.
    let resolve!: (namespace: Namespace) => void, reject!: (failure: unknown) => void;
    record.promise = new Promise((done, fail) => { resolve = done; reject = fail; });
    const fail = (failure: unknown) => { record.state = 'failed'; record.error = failure; reject(failure); };
    const run = () => {
      try {
        const result = execute(record);
        if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
          void Promise.resolve(result).then(() => resolve(complete(record))).catch(fail);
        } else resolve(complete(record));
      } catch (failure) { fail(failure); }
    };
    try {
      hooks.active();
      if (!asyncDependency(record)) resolve(evaluateSync(record));
      else {
        record.state = 'evaluating';
        const pending: Promise<Namespace>[] = [];
        for (const dependency of record.dependencies) {
          const result = evaluateAsync(dependency);
          if (dependency.state !== 'evaluated') pending.push(result);
          if (dependency.state === 'failed') break;
        }
        if (pending.length) void Promise.all(pending).then(run, fail);
        else run();
      }
    } catch (failure) { fail(failure); }
    return record.promise;
  }

  return {
    require(id: string) {
      const record = get(id); prepare(record);
      const asynchronous = asyncDependency(record);
      if (asynchronous) throw error('ERR_REQUIRE_ASYNC_MODULE', `require() cannot load an ESM graph with top-level await or a remote module: ${asynchronous.id}`, asynchronous.id);
      const namespace = evaluateSync(record);
      if (Object.prototype.hasOwnProperty.call(namespace, 'module.exports')) return namespace['module.exports'];
      if (!Object.prototype.hasOwnProperty.call(namespace, 'default') || Object.prototype.hasOwnProperty.call(namespace, '__esModule')) return namespace;
      // Node's require(esm) default-export view has __esModule. Both views use
      // the same bindings and evaluated instance, including later mutations.
      if (!record.requireNamespace) {
        const view = Object.create(null) as Namespace;
        for (const key of Object.keys(namespace)) Object.defineProperty(view, key, { enumerable: true, get: () => namespace[key] });
        Object.defineProperties(view, { __esModule: { value: true, enumerable: true }, [Symbol.toStringTag]: { value: 'Module' } });
        record.requireNamespace = Object.freeze(view);
      }
      return record.requireNamespace;
    },
    import(id: string) { try { const record = get(id); prepare(record); return evaluateAsync(record); } catch (failure) { return Promise.reject(failure); } },
    dispose() { for (const record of records.values()) record.subscribers.clear(); records.clear(); },
  };
}
