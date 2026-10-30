type EventName = string | symbol;
type Listener = (...args: any[]) => unknown;
type StoredListener = Listener & { listener?: Listener };
type Options = { captureRejections?: boolean };
type Track = <T>(promise: Promise<T>) => Promise<T>;
type State = { events: Record<EventName, StoredListener[]>; max?: number; warned: Set<EventName> };
const disposers = new WeakMap<ScriptEvents, () => void>();

export interface ScriptEventEmitter {
  on(event: EventName, listener: Listener): this;
  addListener(event: EventName, listener: Listener): this;
  prependListener(event: EventName, listener: Listener): this;
  once(event: EventName, listener: Listener): this;
  prependOnceListener(event: EventName, listener: Listener): this;
  off(event: EventName, listener: Listener): this;
  removeListener(event: EventName, listener: Listener): this;
  removeAllListeners(event?: EventName): this;
  emit(event: EventName, ...args: any[]): boolean;
  listeners(event: EventName): Listener[];
  rawListeners(event: EventName): StoredListener[];
  eventNames(): EventName[];
  listenerCount(event: EventName, listener?: Listener): number;
  getMaxListeners(): number;
  setMaxListeners(value: number): this;
}
export interface ScriptEvents {
  new(options?: Options): ScriptEventEmitter;
  (this: object, options?: Options): void;
  prototype: ScriptEventEmitter;
  EventEmitter: ScriptEvents;
  defaultMaxListeners: number;
  captureRejections: boolean;
  readonly captureRejectionSymbol: symbol;
  readonly errorMonitor: symbol;
  listenerCount(emitter: ScriptEventEmitter, event: EventName): number;
  getEventListeners(emitter: ScriptEventEmitter, event: EventName): Listener[];
  getMaxListeners(emitter: ScriptEventEmitter): number;
  setMaxListeners(value: number, ...emitters: ScriptEventEmitter[]): void;
  once(emitter: ScriptEventEmitter, event: EventName, options?: { signal?: AbortSignal }): Promise<any[]>;
  on(...args: unknown[]): never;
  addAbortListener(...args: unknown[]): never;
  EventEmitterAsyncResource: new(...args: unknown[]) => never;
}
function unsupported(operation: string): never {
  throw Object.assign(new Error(`${operation} is not supported by the Vtron browser runtime`), { code: 'ERR_NOT_SUPPORTED' });
}
function invalid(message: string): never {
  throw Object.assign(new TypeError(message), { code: 'ERR_INVALID_ARG_TYPE' });
}
function checkListener(listener: unknown): asserts listener is Listener {
  if (typeof listener !== 'function') invalid('listener must be a function');
}
function checkMax(value: unknown): asserts value is number {
  if (typeof value !== 'number') invalid('max listeners must be a number');
  if (Number.isNaN(value) || value < 0) throw Object.assign(new RangeError('max listeners must be a non-negative number'), { code: 'ERR_OUT_OF_RANGE' });
}
function nameOf(event: EventName): EventName { return typeof event === 'symbol' ? event : String(event); }

/** A synchronous EventEmitter, separate from the runtime's error-reporting ScriptEmitter. */
export function createScriptEvents(options: { track?: Track } = {}): ScriptEvents {
  const states = new WeakMap<object, State>();
  const errorMonitor = Symbol('events.errorMonitor');
  const pending = new Set<() => void>();
  let disposed = false;
  let defaultMax = 10;
  const state = (target: object): State => {
    if (!target || (typeof target !== 'object' && typeof target !== 'function')) invalid('EventEmitter receiver must be an object');
    let value = states.get(target);
    if (!value) { value = { events: Object.create(null), warned: new Set() }; states.set(target, value); }
    return value;
  };
  const EventEmitter = function (this: ScriptEventEmitter, configuration?: Options) {
    if (configuration !== undefined) {
      if (!configuration || typeof configuration !== 'object') invalid('EventEmitter options must be an object');
      if (configuration.captureRejections !== undefined && typeof configuration.captureRejections !== 'boolean') invalid('captureRejections must be a boolean');
      if (Object.keys(configuration).some(key => key !== 'captureRejections') || configuration.captureRejections) unsupported('EventEmitter captureRejections or custom options');
    }
    state(this);
  } as unknown as ScriptEvents;
  function add(target: ScriptEventEmitter, event: EventName, listener: StoredListener, prepend: boolean) {
    checkListener(listener);
    event = nameOf(event);
    const current = state(target);
    if (current.events.newListener?.length) target.emit('newListener', event, listener.listener || listener);
    const listeners = current.events[event] || (current.events[event] = []);
    if (prepend) listeners.unshift(listener); else listeners.push(listener);
    const max = current.max ?? defaultMax;
    if (max > 0 && listeners.length > max && !current.warned.has(event)) {
      current.warned.add(event);
      const warning = Object.assign(new Error(`Possible EventEmitter memory leak detected. ${listeners.length} ${String(event)} listeners added.`), { name: 'MaxListenersExceededWarning', emitter: target, type: event, count: listeners.length });
      console.warn(warning);
    }
    return target;
  }
  function addOnce(target: ScriptEventEmitter, event: EventName, listener: Listener, prepend: boolean) {
    checkListener(listener);
    let fired = false;
    const wrapped: StoredListener = function (this: ScriptEventEmitter, ...args: any[]) {
      if (fired) return;
      fired = true;
      target.removeListener(event, wrapped);
      return listener.apply(target, args);
    };
    Object.defineProperty(wrapped, 'name', { value: 'bound onceWrapper' });
    wrapped.listener = listener;
    return add(target, event, wrapped, prepend);
  }
  // Enumerable methods preserve Node's mixin use, e.g. connect's function application.
  Object.assign(EventEmitter.prototype, {
    on(this: ScriptEventEmitter, event: EventName, listener: Listener) { return add(this, event, listener, false); },
    prependListener(this: ScriptEventEmitter, event: EventName, listener: Listener) { return add(this, event, listener, true); },
    once(this: ScriptEventEmitter, event: EventName, listener: Listener) { return addOnce(this, event, listener, false); },
    prependOnceListener(this: ScriptEventEmitter, event: EventName, listener: Listener) { return addOnce(this, event, listener, true); },
    removeListener(this: ScriptEventEmitter, event: EventName, listener: Listener) {
      checkListener(listener); event = nameOf(event);
      const current = state(this);
      const listeners = current.events[event];
      if (!listeners) return this;
      for (let index = listeners.length - 1; index >= 0; index--) {
        const removed = listeners[index];
        if (removed !== listener && removed.listener !== listener) continue;
        const notification = listeners.length === 1 ? removed.listener || removed : listener;
        listeners.splice(index, 1);
        if (!listeners.length) { delete current.events[event]; current.warned.delete(event); }
        if (current.events.removeListener?.length) this.emit('removeListener', event, notification);
        break;
      }
      return this;
    },
    removeAllListeners(this: ScriptEventEmitter, event?: EventName) {
      const current = state(this);
      if (arguments.length) {
        const key = nameOf(event!);
        for (const listener of [...(current.events[key] || [])].reverse()) this.removeListener(key, listener);
      } else {
        for (const key of Reflect.ownKeys(current.events)) if (key !== 'removeListener') this.removeAllListeners(key);
        this.removeAllListeners('removeListener');
      }
      return this;
    },
    emit(this: ScriptEventEmitter, event: EventName, ...args: any[]) {
      event = nameOf(event);
      const current = state(this);
      if (event === 'error') {
        for (const monitor of [...(current.events[errorMonitor] || [])]) monitor.apply(this, args);
        if (!current.events.error?.length) {
          if (args[0] instanceof Error) throw args[0];
          throw Object.assign(new Error(`Unhandled error. (${String(args[0])})`), { code: 'ERR_UNHANDLED_ERROR', context: args[0] });
        }
      }
      const listeners = [...(current.events[event] || [])];
      for (const listener of listeners) listener.apply(this, args);
      return listeners.length > 0;
    },
    listeners(this: ScriptEventEmitter, event: EventName) { return (state(this).events[nameOf(event)] || []).map(listener => listener.listener || listener); },
    rawListeners(this: ScriptEventEmitter, event: EventName) { return [...(state(this).events[nameOf(event)] || [])]; },
    eventNames(this: ScriptEventEmitter) { return Reflect.ownKeys(state(this).events); },
    listenerCount(this: ScriptEventEmitter, event: EventName, listener?: Listener) {
      if (listener !== undefined) checkListener(listener);
      const listeners = state(this).events[nameOf(event)] || [];
      return listener ? listeners.filter(value => value === listener || value.listener === listener).length : listeners.length;
    },
    getMaxListeners(this: ScriptEventEmitter) { return state(this).max ?? defaultMax; },
    setMaxListeners(this: ScriptEventEmitter, value: number) { checkMax(value); state(this).max = value; return this; },
  } satisfies Partial<ScriptEventEmitter>);
  EventEmitter.prototype.addListener = EventEmitter.prototype.on;
  EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
  EventEmitter.EventEmitter = EventEmitter;
  Object.defineProperties(EventEmitter, {
    defaultMaxListeners: { enumerable: true, get: () => defaultMax, set: (value: number) => { checkMax(value); defaultMax = value; } },
    captureRejections: { enumerable: true, get: () => false, set: (value: boolean) => { if (value !== false) unsupported('events.captureRejections'); } },
    captureRejectionSymbol: { enumerable: true, value: Symbol.for('nodejs.rejection') },
    errorMonitor: { enumerable: true, value: errorMonitor },
  });
  function emitterArgument(emitter: ScriptEventEmitter) {
    if (!emitter || typeof emitter.on !== 'function' || typeof emitter.removeListener !== 'function') unsupported('events helpers for non-EventEmitter targets');
    return emitter;
  }
  EventEmitter.listenerCount = (emitter, event) => emitterArgument(emitter).listenerCount(event);
  EventEmitter.getEventListeners = (emitter, event) => emitterArgument(emitter).listeners(event);
  EventEmitter.getMaxListeners = emitter => emitterArgument(emitter).getMaxListeners();
  EventEmitter.setMaxListeners = (value, ...emitters) => {
    checkMax(value);
    if (!emitters.length) EventEmitter.defaultMaxListeners = value;
    else for (const emitter of emitters) emitterArgument(emitter).setMaxListeners(value);
  };
  EventEmitter.once = (emitter, event, configuration = {}) => {
    emitterArgument(emitter);
    if (!configuration || typeof configuration !== 'object') invalid('events.once options must be an object');
    if (Object.keys(configuration).some(key => key !== 'signal')) unsupported('events.once options other than signal');
    const signal = configuration.signal;
    if (signal !== undefined && (!signal || typeof signal.addEventListener !== 'function' || typeof signal.removeEventListener !== 'function' || typeof signal.aborted !== 'boolean')) invalid('signal must be an AbortSignal');
    const promise = new Promise<any[]>((resolve, reject) => {
      const cleanup = () => {
        pending.delete(interrupt);
        emitter.removeListener(event, handle);
        if (event !== 'error') emitter.removeListener('error', fail);
        signal?.removeEventListener('abort', abort);
      };
      const handle = (...args: any[]) => { cleanup(); resolve(args); };
      const fail = (error: unknown) => { cleanup(); reject(error); };
      const abort = () => { cleanup(); reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError', code: 'ABORT_ERR', cause: signal?.reason })); };
      const interrupt = () => { cleanup(); reject(Object.assign(new Error('Script interrupted'), { name: 'AbortError', code: 'ABORT_ERR' })); };
      if (disposed) { interrupt(); return; }
      if (signal?.aborted) { abort(); return; }
      pending.add(interrupt);
      emitter.once(event, handle);
      if (event !== 'error') emitter.once('error', fail);
      signal?.addEventListener('abort', abort, { once: true });
    });
    return options.track ? options.track(promise) : promise;
  };
  EventEmitter.on = () => unsupported('events.on async iteration');
  EventEmitter.addAbortListener = () => unsupported('events.addAbortListener');
  EventEmitter.EventEmitterAsyncResource = function () { return unsupported('events.EventEmitterAsyncResource'); } as unknown as ScriptEvents['EventEmitterAsyncResource'];
  disposers.set(EventEmitter, () => { disposed = true; for (const cancel of [...pending]) cancel(); pending.clear(); });
  return EventEmitter;
}

/** Runtime cleanup for temporary listeners owned by events.once promises. */
export function disposeScriptEvents(events: ScriptEvents) { disposers.get(events)?.(); }
