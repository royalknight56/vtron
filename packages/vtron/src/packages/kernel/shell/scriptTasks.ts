import { scriptAbortError } from './scriptIO';

// Keep detached CommonJS entry points alive while their browser-backed I/O is active.
export function createScriptTasks(reportError: (error: unknown) => void, fetchImpl: typeof globalThis.fetch = (...args) => globalThis.fetch(...args)) {
  const pending = new Set<Promise<unknown>>();
  const timers = new Set<ReturnType<typeof globalThis.setTimeout>>();
  const waiters = new Set<() => void>();
  let disposed = false;
  const notify = () => { for (const resolve of waiters) resolve(); waiters.clear(); };
  const isActive = () => pending.size > 0 || timers.size > 0;
  const track = <T>(promise: Promise<T>): Promise<T> => {
    pending.add(promise);
    void promise.then(() => {}, () => {}).finally(() => { pending.delete(promise); notify(); });
    return promise;
  };
  const wrap = <T extends (...args: any[]) => Promise<any>>(operation: T) =>
    ((...args: Parameters<T>) => disposed ? Promise.reject(scriptAbortError()) : track(operation(...args))) as T;
  const call = (callback: (...args: any[]) => unknown, args: unknown[]) => {
    if (disposed) return;
    try {
      const result = callback(...args);
      if (result && typeof (result as Promise<unknown>).then === 'function') track(Promise.resolve(result).catch(reportError));
    } catch (error) { reportError(error); }
  };
  const schedule = (repeat: boolean, callback: (...args: any[]) => unknown, delay?: number, ...args: unknown[]) => {
    if (disposed) throw scriptAbortError();
    if (typeof callback !== 'function') throw new TypeError('Timer callback must be a function');
    const run = () => {
      if (!repeat) { timers.delete(timer); notify(); }
      call(callback, args);
    };
    const timer = repeat ? globalThis.setInterval(run, delay) : globalThis.setTimeout(run, delay);
    timers.add(timer);
    return timer;
  };
  const clear = (timer: ReturnType<typeof globalThis.setTimeout>) => {
    globalThis.clearTimeout(timer); globalThis.clearInterval(timer);
    timers.delete(timer); notify();
  };
  return {
    track, wrap, isActive,
    fetch: ((...args: Parameters<typeof fetch>) => disposed ? Promise.reject(scriptAbortError()) : track(fetchImpl(...args))) as typeof fetch,
    setTimeout: (callback: (...args: any[]) => unknown, delay?: number, ...args: unknown[]) => schedule(false, callback, delay, ...args),
    setInterval: (callback: (...args: any[]) => unknown, delay?: number, ...args: unknown[]) => schedule(true, callback, delay, ...args),
    clearTimeout: clear,
    clearInterval: clear,
    async settle() { while (!disposed && isActive()) await new Promise<void>(resolve => waiters.add(resolve)); },
    dispose() { disposed = true; for (const timer of timers) clear(timer); notify(); },
  };
}
