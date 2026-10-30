import { scriptAbortError } from './scriptIO';

export interface ScriptTimer {
  ref(): this;
  unref(): this;
  hasRef(): boolean;
  refresh(): this;
  close(): this;
  [Symbol.toPrimitive](): number;
}
type TimerState = { native?: ReturnType<typeof globalThis.setTimeout>; active: boolean; referenced: boolean; cancelled: boolean };
let nextTimerId = 0;

// Keep detached entry points alive while referenced timers or browser-backed I/O are active.
export function createScriptTasks(reportError: (error: unknown) => void, fetchImpl: typeof globalThis.fetch = (...args) => globalThis.fetch(...args)) {
  const pending = new Set<Promise<unknown>>();
  const timers = new Map<number, TimerState>();
  const handles = new WeakMap<object, { id: number; state: TimerState }>();
  const waiters = new Set<() => void>();
  const ticks: Array<{ callback: (...args: any[]) => unknown; args: unknown[] }> = [];
  let tickScheduled = false;
  let disposed = false;
  const notify = () => { for (const resolve of waiters) resolve(); waiters.clear(); };
  const isActive = () => pending.size > 0 || tickScheduled || ticks.length > 0 || [...timers.values()].some(timer => timer.referenced);
  const track = <T>(promise: Promise<T>): Promise<T> => {
    // Return the observed chain so callers can handle its rejection. Observing
    // an ignored promise with a no-op rejection handler hides detached import
    // and I/O failures from the Worker's unhandledrejection event.
    const tracked = promise.finally(() => { pending.delete(tracked); notify(); });
    pending.add(tracked);
    return tracked;
  };
  const wrap = <T extends (...args: any[]) => Promise<any>>(operation: T) =>
    ((...args: Parameters<T>) => disposed ? Promise.reject(scriptAbortError()) : track(operation(...args))) as T;
  const call = (callback: (...args: any[]) => unknown, args: unknown[]) => {
    if (disposed) return false;
    try {
      const result = callback(...args);
      if (result && typeof (result as Promise<unknown>).then === 'function') track(Promise.resolve(result).catch(reportError));
      return true;
    } catch (error) { reportError(error); return false; }
  };
  // Browser compatibility queue: runs real callbacks in FIFO microtasks. It
  // cannot reprioritize Promise jobs already queued by the browser engine.
  const nextTick = (callback: (...args: any[]) => unknown, ...args: unknown[]) => {
    if (disposed) throw scriptAbortError();
    if (typeof callback !== 'function') throw Object.assign(new TypeError('nextTick callback must be a function'), { code: 'ERR_INVALID_ARG_TYPE' });
    ticks.push({ callback, args });
    if (tickScheduled) return;
    tickScheduled = true;
    queueMicrotask(() => {
      for (let index = 0; !disposed && index < ticks.length; index++) {
        const tick = ticks[index];
        if (!call(tick.callback, tick.args)) break;
      }
      ticks.length = 0;
      tickScheduled = false; notify();
    });
  };
  const clear = (timer?: ScriptTimer | number | string | null) => {
    const entry = timer && typeof timer === 'object' ? handles.get(timer) : undefined;
    const id = typeof timer === 'number' ? timer : typeof timer === 'string' && /^\d+$/.test(timer) ? Number(timer) : entry?.id;
    if (id === undefined) return;
    const state = entry?.state ?? timers.get(id);
    if (!state) return;
    globalThis.clearTimeout(state.native); globalThis.clearInterval(state.native);
    state.active = false; state.cancelled = true;
    timers.delete(id); notify();
  };
  const schedule = (repeat: boolean, callback: (...args: any[]) => unknown, delay?: number, ...args: unknown[]): ScriptTimer => {
    if (disposed) throw scriptAbortError();
    if (typeof callback !== 'function') throw new TypeError('Timer callback must be a function');
    if (nextTimerId >= Number.MAX_SAFE_INTEGER) throw new RangeError('Script timer ID limit reached');
    const id = ++nextTimerId;
    const numeric = delay === undefined ? 1 : delay * 1;
    const milliseconds = numeric >= 1 && numeric <= 2147483647 ? Math.trunc(numeric) : 1;
    const state: TimerState = { active: false, referenced: true, cancelled: false };
    const run = () => {
      if (disposed || !state.active) return;
      if (!repeat) { state.active = false; timers.delete(id); notify(); }
      call(callback, args);
    };
    const start = () => {
      if (disposed) throw scriptAbortError();
      if (state.cancelled) return;
      globalThis.clearTimeout(state.native); globalThis.clearInterval(state.native);
      state.active = true; timers.set(id, state);
      state.native = repeat ? globalThis.setInterval(run, milliseconds) : globalThis.setTimeout(run, milliseconds);
      notify();
    };
    const timer: ScriptTimer = {
      ref() { state.referenced = true; notify(); return this; },
      unref() { state.referenced = false; notify(); return this; },
      hasRef() { return state.referenced; },
      refresh() { start(); return this; },
      close() { clear(timer); return this; },
      [Symbol.toPrimitive]() { return id; },
    };
    handles.set(timer, { id, state });
    start();
    return timer;
  };
  return {
    track, wrap, isActive, nextTick,
    fetch: ((...args: Parameters<typeof fetch>) => disposed ? Promise.reject(scriptAbortError()) : track(fetchImpl(...args))) as typeof fetch,
    setTimeout: (callback: (...args: any[]) => unknown, delay?: number, ...args: unknown[]) => schedule(false, callback, delay, ...args),
    setInterval: (callback: (...args: any[]) => unknown, delay?: number, ...args: unknown[]) => schedule(true, callback, delay, ...args),
    // Browser task scheduling has no libuv check phase. Execute once on a
    // later task, with the same cancellation and reference lifecycle as timers.
    setImmediate: (callback: (...args: any[]) => unknown, ...args: unknown[]) => schedule(false, callback, 0, ...args),
    clearTimeout: clear,
    clearInterval: clear,
    clearImmediate: clear,
    async settle() { while (!disposed && isActive()) await new Promise<void>(resolve => waiters.add(resolve)); },
    dispose() { disposed = true; ticks.length = 0; tickScheduled = false; for (const id of timers.keys()) clear(id); notify(); },
  };
}
