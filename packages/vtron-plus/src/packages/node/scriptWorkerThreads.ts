import { ScriptEmitter } from './scriptIO';

export type ScriptWorkerRequest = { filename: string; eval: boolean; argv: string[]; execArgv: string[]; env: Record<string, string>; workerData: unknown; name?: string };
export type ScriptWorkerBackend = (request: ScriptWorkerRequest, parentPort: MessagePort, controlPort: MessagePort, transfer: Transferable[]) => { terminate(): void };
export type ScriptThread = { workerData: unknown; parentPort: MessagePort; threadId: number; name?: string };
type Hooks = { backend?: ScriptWorkerBackend; thread?: ScriptThread; execArgv?: readonly string[]; env?: () => Record<string, string>; track: <T>(promise: Promise<T>) => Promise<T>; reportError: (error: unknown) => void; resolve: (path: string | URL) => string };
type WorkerOptions = { eval?: boolean; argv?: string[]; execArgv?: string[]; env?: Record<string, unknown> | symbol | null; workerData?: unknown; transferList?: unknown[]; name?: string };
type Emitter = Pick<ScriptEmitter, keyof ScriptEmitter>;
type PortListener = ((event: any) => unknown) | { handleEvent(event: Event): unknown };
type PortListenerOptions = { once?: boolean; capture?: boolean; signal?: AbortSignal; passive?: boolean };
type Port = Emitter & { onmessage: ((event: MessageEvent) => unknown) | null; onmessageerror: ((event: MessageEvent) => unknown) | null; addEventListener(type: string, listener: PortListener | null, options?: boolean | PortListenerOptions): void; removeEventListener(type: string, listener: PortListener | null, options?: boolean | PortListenerOptions): void; postMessage(value: unknown, transfer?: unknown[]): void; start(): void; close(): void; ref(): Port; unref(): Port; hasRef(): boolean };
type ThreadWorker = Emitter & { threadId: number; postMessage(value: unknown, transfer?: unknown[]): void; terminate(): Promise<number>; ref(): ThreadWorker; unref(): ThreadWorker; readonly resourceLimits: object; readonly stdout: never; readonly stderr: never };
interface WorkerThreadsModule {
  SHARE_ENV: symbol;
  isMainThread: boolean; isInternalThread: boolean; threadId: number; threadName: string; parentPort: Port | null; workerData: unknown; resourceLimits: object;
  MessageChannel: new () => { port1: Port; port2: Port };
  MessagePort: new (native: MessagePort) => Port;
  Worker: new (filename: string | URL, options?: WorkerOptions) => ThreadWorker;
  receiveMessageOnPort: () => never; moveMessagePortToContext: () => never; markAsUntransferable: () => never;
  getEnvironmentData: () => never; setEnvironmentData: () => never; postMessageToThread: () => never;
}
const unsupported = (name: string): never => { throw Object.assign(new Error(`worker_threads.${name} is not supported by the Vtron browser runtime`), { code: 'ERR_NOT_SUPPORTED' }); };

/** Node event/transfer/lifecycle conventions over actual browser message ports
 * and host-created Node runtime Workers, without per-package loaders. */
export function createScriptWorkerThreads(hooks: Hooks): { module: WorkerThreadsModule; dispose(): void } {
  const SHARE_ENV = Symbol('nodejs.worker_threads.SHARE_ENV');
  const snapshotEnv = (option: WorkerOptions['env']) => {
    if (option === SHARE_ENV) return unsupported('SHARE_ENV (shared environment writes)');
    const value = option == null ? (hooks.env ? hooks.env() : {}) : option;
    if (!value || typeof value !== 'object') throw Object.assign(new TypeError('Worker.env must be an environment object, null or undefined'), { code: 'ERR_INVALID_ARG_TYPE' });
    if (Array.isArray(value)) return unsupported('Worker.env arrays');
    const env: Record<string, string> = Object.create(null);
    for (const [key, item] of Object.entries(value)) env[key] = `${item}`;
    return env;
  };
  const ports = new Set<NodePort>(), workers = new Set<Worker>();
  const wrappers = new WeakMap<MessagePort, NodePort>();
  const transform = (value: unknown, incoming: boolean, seen = new Map<object, unknown>()): any => {
    if (value instanceof NodePort) return incoming ? value : value.native;
    if (value instanceof globalThis.MessagePort) return incoming ? wrap(value) : value;
    if (!value || typeof value !== 'object') return value;
    if (seen.has(value)) return seen.get(value);
    if (Array.isArray(value)) { const result: unknown[] = []; seen.set(value, result); for (const item of value) result.push(transform(item, incoming, seen)); return result; }
    if (value instanceof Map) { const result = new Map(); seen.set(value, result); for (const [key, item] of value) result.set(transform(key, incoming, seen), transform(item, incoming, seen)); return result; }
    if (value instanceof Set) { const result = new Set(); seen.set(value, result); for (const item of value) result.add(transform(item, incoming, seen)); return result; }
    if (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) { const result = Object.create(Object.getPrototypeOf(value)); seen.set(value, result); for (const [key, item] of Object.entries(value)) Object.defineProperty(result, key, { enumerable: true, configurable: true, writable: true, value: transform(item, incoming, seen) }); return result; }
    return value;
  };
  const transfers = (list: unknown[] = []) => list.map(value => value instanceof NodePort ? value.native : value) as Transferable[];
  const detached = (list: Transferable[]) => { for (const value of list) if (value instanceof globalThis.MessagePort) wrappers.get(value)?.detach(); };
  class NodePort extends ScriptEmitter {
    private closed = false;
    private referenced = false;
    private messageListeners = 0;
    private release?: () => void;
    private queued: Array<{ value: unknown; event: MessageEvent }> = [];
    private currentMessage?: MessageEvent;
    private attributes = new Map<string, { callback: ((event: MessageEvent) => unknown) | null; listener: (value: unknown) => void }>();
    private eventListeners: Array<{ type: string; callback: PortListener; capture: boolean; listener: (...args: any[]) => void; signal?: AbortSignal; abort?: () => void }> = [];
    constructor(readonly native: MessagePort) {
      if (!(native instanceof globalThis.MessagePort)) throw Object.assign(new TypeError('MessagePort cannot be constructed directly'), { code: 'ERR_ILLEGAL_CONSTRUCTOR' });
      let changed = () => {};
      super(hooks.reportError, () => changed());
      changed = () => this.changed();
      wrappers.set(native, this); ports.add(this);
      native.addEventListener('message', this.message); native.addEventListener('messageerror', this.messageError); native.start();
    }
    private changed() {
      const count = this.listenerCount('message');
      if (!!count !== !!this.messageListeners) this.referenced = !!count;
      this.messageListeners = count;
      if (this.closed || !this.referenced) { this.release?.(); this.release = undefined; }
      else if (!this.release) hooks.track(new Promise<void>(resolve => { this.release = resolve; }));
      if (count && this.queued.length) queueMicrotask(() => { if (!this.closed && this.listenerCount('message')) for (const message of this.queued.splice(0)) this.deliver(message.value, message.event); });
    }
    private deliver(value: unknown, event: MessageEvent) { const previous = this.currentMessage; this.currentMessage = event; try { this.emit('message', value); } finally { this.currentMessage = previous; } }
    private message = (event: MessageEvent) => { const value = transform(event.data, true); if (this.listenerCount('message')) this.deliver(value, event); else { if (this.queued.length >= 1024) { this.close(); hooks.reportError(Object.assign(new Error('Message port queue limit reached'), { code: 'ERR_WORKER_MESSAGE_LIMIT' })); return; } this.queued.push({ value, event }); } };
    private messageError = (event: MessageEvent) => { this.emit('messageerror', event.data); };
    private webEvent(type: string, value: unknown) {
      const event = type === 'message' || type === 'messageerror' ? new MessageEvent(type, { data: value }) : new Event(type);
      Object.defineProperties(event, { target: { value: this }, currentTarget: { value: this } });
      if (event instanceof MessageEvent) Object.defineProperty(event, 'ports', { value: (this.currentMessage?.ports ?? []).map(wrap) });
      return event;
    }
    private setAttribute(type: string, callback: ((event: MessageEvent) => unknown) | null) {
      const value = typeof callback === 'function' ? callback : null;
      const current = this.attributes.get(type);
      if (current) { current.callback = value; if (!value) { this.off(type, current.listener); this.attributes.delete(type); } }
      else if (value) { const entry = { callback: value as ((event: MessageEvent) => unknown) | null, listener: (data: unknown) => entry.callback?.call(this, this.webEvent(type, data) as MessageEvent) }; this.attributes.set(type, entry); this.on(type, entry.listener); }
    }
    get onmessage() { return this.attributes.get('message')?.callback ?? null; }
    set onmessage(value: ((event: MessageEvent) => unknown) | null) { this.setAttribute('message', value); }
    get onmessageerror() { return this.attributes.get('messageerror')?.callback ?? null; }
    set onmessageerror(value: ((event: MessageEvent) => unknown) | null) { this.setAttribute('messageerror', value); }
    addEventListener(type: string, callback: PortListener | null, options: boolean | PortListenerOptions = {}) {
      if (!callback) return;
      if (typeof callback !== 'function' && typeof callback.handleEvent !== 'function') throw new TypeError('MessagePort listener must be a function or handleEvent object');
      if (typeof type !== 'string') throw new TypeError('MessagePort event type must be a string');
      const settings = typeof options === 'boolean' ? { capture: options } : options;
      if (!settings || typeof settings !== 'object') throw new TypeError('MessagePort listener options must be an object or boolean');
      if (Object.keys(settings).some(key => !['capture', 'once', 'signal', 'passive'].includes(key)) || settings.passive) unsupported('MessagePort listener options');
      if (settings.signal?.aborted) return;
      const capture = !!settings.capture;
      if (this.eventListeners.some(entry => entry.type === type && entry.callback === callback && entry.capture === capture)) return;
      const entry = { type, callback, capture, signal: settings.signal, abort: undefined as (() => void) | undefined, listener: (value: unknown) => {
        if (settings.once) this.removeEventListener(type, callback, capture);
        const event = this.webEvent(type, value);
        if (typeof callback === 'function') callback.call(this, event); else callback.handleEvent(event);
      } };
      entry.abort = () => this.removeEventListener(type, callback, capture);
      this.eventListeners.push(entry); settings.signal?.addEventListener('abort', entry.abort, { once: true }); this.on(type, entry.listener);
    }
    removeEventListener(type: string, callback: PortListener | null, options: boolean | PortListenerOptions = {}) {
      const capture = typeof options === 'boolean' ? options : !!options?.capture;
      const index = this.eventListeners.findIndex(entry => entry.type === type && entry.callback === callback && entry.capture === capture);
      if (index < 0) return;
      const [entry] = this.eventListeners.splice(index, 1); this.off(type, entry.listener); if (entry.abort) entry.signal?.removeEventListener('abort', entry.abort);
    }
    dispatchEvent(): never { return unsupported('MessagePort.dispatchEvent'); }
    private unhookSignals() { for (const entry of this.eventListeners) if (entry.abort) entry.signal?.removeEventListener('abort', entry.abort); }
    postMessage(value: unknown, transfer?: unknown[]) { if (this.closed) throw Object.assign(new Error('Message port is closed'), { code: 'ERR_CLOSED_MESSAGE_PORT' }); const list = transfers(transfer); this.native.postMessage(transform(value, false), list); detached(list); }
    start() { this.native.start(); }
    close() { if (this.closed) return; this.closed = true; this.changed(); ports.delete(this); this.native.removeEventListener('message', this.message); this.native.removeEventListener('messageerror', this.messageError); this.native.close(); this.queued.length = 0; this.unhookSignals(); this.emit('close'); }
    detach() { if (this.closed) return; this.closed = true; this.changed(); ports.delete(this); this.native.removeEventListener('message', this.message); this.native.removeEventListener('messageerror', this.messageError); this.queued.length = 0; this.unhookSignals(); this.emit('close'); }
    ref() { this.referenced = true; this.changed(); return this; }
    unref() { this.referenced = false; this.changed(); return this; }
    hasRef() { return !this.closed && this.referenced; }
  }
  function wrap(port: MessagePort) { return wrappers.get(port) ?? new NodePort(port); }
  class MessageChannel { readonly port1: NodePort; readonly port2: NodePort; constructor() { const channel = new globalThis.MessageChannel(); this.port1 = wrap(channel.port1); this.port2 = wrap(channel.port2); } }
  class Worker extends ScriptEmitter {
    threadId = -1;
    private referenced = true;
    private release?: () => void;
    private stopped = false;
    private backend!: { terminate(): void };
    private port: NodePort;
    private control: MessagePort;
    private resolveExit!: (code: number) => void;
    private exited: Promise<number>;
    constructor(filename: string | URL, options: WorkerOptions = {}) {
      super(hooks.reportError);
      if (!hooks.backend) unsupported('Worker outside Node Worker mode');
      for (const key of Object.keys(options)) if (!['eval', 'argv', 'execArgv', 'env', 'workerData', 'transferList', 'name'].includes(key)) unsupported(`Worker option ${key}`);
      if (options.eval !== undefined && typeof options.eval !== 'boolean') throw new TypeError('Worker.eval must be boolean');
      if (options.name !== undefined && typeof options.name !== 'string') throw new TypeError('Worker.name must be a string');
      if (options.argv !== undefined && (!Array.isArray(options.argv) || options.argv.some(value => typeof value !== 'string'))) throw new TypeError('Worker.argv must contain strings');
      if (options.execArgv !== undefined) {
        if (!Array.isArray(options.execArgv) || options.execArgv.some(value => typeof value !== 'string')) throw new TypeError('Worker.execArgv must contain strings');
        if (options.execArgv.length) throw Object.assign(new Error('Node engine flags in Worker.execArgv are not supported by the Vtron browser runtime'), { code: 'ERR_WORKER_INVALID_EXEC_ARGV' });
      }
      if (options.eval && typeof filename !== 'string') throw new TypeError('Worker eval source must be a string');
      const env = snapshotEnv(options.env);
      const data = new globalThis.MessageChannel(), control = new globalThis.MessageChannel();
      this.port = wrap(data.port1); this.control = control.port1;
      this.exited = new Promise(resolve => { this.resolveExit = resolve; });
      this.port.on('message', value => this.emit('message', value)); this.port.unref();
      this.port.on('messageerror', value => this.emit('messageerror', value));
      this.control.onmessage = event => {
        if (this.stopped) return;
        const message = event.data;
        if (message?.type === 'online') { this.threadId = message.threadId; this.emit('online'); }
        else if (message?.type === 'error') this.emit('error', Object.assign(new Error(message.message), message));
        else if (message?.type === 'exit') this.finish(message.code);
      };
      this.control.start();
      try { this.backend = hooks.backend!({ filename: options.eval ? filename as string : hooks.resolve(filename), eval: options.eval ?? false, argv: options.argv ?? [], execArgv: [...(options.execArgv ?? hooks.execArgv ?? [])], env, workerData: transform(options.workerData, false), name: options.name }, data.port2, control.port2, transfers(options.transferList)); detached(transfers(options.transferList)); }
      catch (error) { this.port.close(); this.control.close(); data.port2.close(); control.port2.close(); throw error; }
      workers.add(this); this.hold();
    }
    private hold() { if (!this.stopped && this.referenced && !this.release) hooks.track(new Promise<void>(resolve => { this.release = resolve; })); }
    private finish(code: number) { if (this.stopped) return; this.stopped = true; this.threadId = -1; this.release?.(); this.release = undefined; this.port.close(); this.control.close(); workers.delete(this); this.resolveExit(code); this.emit('exit', code); }
    postMessage(value: unknown, transfer?: unknown[]) { this.port.postMessage(value, transfer); }
    terminate() { if (!this.stopped) this.backend.terminate(); return this.exited; }
    ref() { this.referenced = true; this.hold(); return this; }
    unref() { this.referenced = false; this.release?.(); this.release = undefined; return this; }
    get resourceLimits() { return {}; }
    get stdout(): never { return unsupported('Worker.stdout'); }
    get stderr(): never { return unsupported('Worker.stderr'); }
  }
  const module = { SHARE_ENV, isMainThread: !hooks.thread, isInternalThread: false, threadId: hooks.thread?.threadId ?? 0, threadName: hooks.thread?.name ?? '', parentPort: hooks.thread ? wrap(hooks.thread.parentPort) : null, workerData: hooks.thread ? transform(hooks.thread.workerData, true) : null, resourceLimits: {}, MessageChannel, MessagePort: NodePort, Worker,
    receiveMessageOnPort: () => unsupported('receiveMessageOnPort'), moveMessagePortToContext: () => unsupported('moveMessagePortToContext'), markAsUntransferable: () => unsupported('markAsUntransferable'),
    getEnvironmentData: () => unsupported('getEnvironmentData'), setEnvironmentData: () => unsupported('setEnvironmentData'), postMessageToThread: () => unsupported('postMessageToThread') };
  return { module, dispose() { for (const worker of workers) void worker.terminate(); for (const port of [...ports]) port.close(); } };
}
