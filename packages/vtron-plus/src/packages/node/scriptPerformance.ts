/** Browser-backed subset of node:perf_hooks. Node-only measurements are unavailable. */
export function createScriptPerformance(reportError: (error: unknown) => void) {
  const observers = new Set<PerformanceObserver>();
  let active = true;
  const unsupported = (name: string): never => {
    throw Object.assign(new Error(`perf_hooks.${name} requires Node.js and is not supported by the Vtron browser runtime`), { code: 'ERR_NOT_SUPPORTED' });
  };
  const NativeObserver = globalThis.PerformanceObserver;
  const Observer = typeof NativeObserver === 'function' ? class extends NativeObserver {
    constructor(callback: PerformanceObserverCallback) {
      if (typeof callback !== 'function') throw new TypeError('PerformanceObserver callback must be a function');
      super((entries, observer) => {
        if (!active) return;
        try { callback(entries, observer); } catch (error) { reportError(error); }
      });
      observers.add(this);
    }
    observe(options?: PerformanceObserverInit) {
      if (!active) throw Object.assign(new Error('Script runtime has been disposed'), { code: 'ABORT_ERR' });
      super.observe(options);
    }
  } : class { constructor() { unsupported('PerformanceObserver'); } };
  return {
    module: {
      performance: globalThis.performance,
      PerformanceObserver: Observer,
      PerformanceEntry: globalThis.PerformanceEntry,
      PerformanceMark: globalThis.PerformanceMark,
      PerformanceMeasure: globalThis.PerformanceMeasure,
      PerformanceResourceTiming: globalThis.PerformanceResourceTiming,
      createHistogram: () => unsupported('createHistogram'),
      monitorEventLoopDelay: () => unsupported('monitorEventLoopDelay'),
    },
    dispose() { active = false; for (const observer of observers) observer.disconnect(); observers.clear(); },
  };
}
