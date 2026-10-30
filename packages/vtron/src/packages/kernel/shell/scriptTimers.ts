type TimerOptions = { signal?: AbortSignal; ref?: boolean };

function invalidArgument(message: string): never {
  throw Object.assign(new TypeError(message), { code: 'ERR_INVALID_ARG_TYPE' });
}

function signalOf(options: TimerOptions) {
  if (!options || typeof options !== 'object') invalidArgument('Timer options must be an object');
  if (options.ref !== undefined && typeof options.ref !== 'boolean') invalidArgument('options.ref must be a boolean');
  if (options.signal !== undefined && !(options.signal instanceof AbortSignal)) invalidArgument('options.signal must be an AbortSignal');
  // Browsers do not have Node's process-lifetime ref/unref behavior.
  return options.signal;
}

function abortError(signal: AbortSignal) {
  return Object.assign(new Error('The operation was aborted'), { name: 'AbortError', code: 'ABORT_ERR', cause: signal.reason });
}

function timerDelay(delay: number) {
  const milliseconds = +delay;
  return milliseconds >= 1 && milliseconds <= 2147483647 ? Math.trunc(milliseconds) : 1;
}

async function wait<T>(delay: number, value: T, options: TimerOptions = {}): Promise<T> {
  const signal = signalOf(options);
  if (signal?.aborted) throw abortError(signal);
  return new Promise<T>((resolve, reject) => {
    const cleanup = () => {
      globalThis.clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
    };
    const cancel = () => { cleanup(); reject(abortError(signal!)); };
    const timer = globalThis.setTimeout(() => { cleanup(); resolve(value); }, delay);
    signal?.addEventListener('abort', cancel, { once: true });
  });
}

async function timeout<T>(delay = 1, value?: T, options?: TimerOptions) {
  return wait(timerDelay(delay), value, options);
}

function immediate<T>(value?: T, options?: TimerOptions) {
  // Yield to another browser task; a resolved Promise would only yield a microtask.
  return wait(0, value, options);
}

async function* interval<T>(delay = 1, value?: T, options: TimerOptions = {}) {
  const signal = signalOf(options);
  if (signal?.aborted) throw abortError(signal);
  let ticks = 0;
  let wake: (() => void) | undefined;
  const notify = () => { const resume = wake; wake = undefined; resume?.(); };
  const timer = globalThis.setInterval(() => { ticks++; notify(); }, timerDelay(delay));
  const cancel = () => { globalThis.clearInterval(timer); notify(); };
  signal?.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      if (!ticks && !signal?.aborted) await new Promise<void>(resolve => { wake = resolve; });
      if (signal?.aborted) throw abortError(signal);
      ticks--;
      yield value;
    }
  } finally {
    globalThis.clearInterval(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

export const timersPromises = {
  setTimeout: timeout,
  setImmediate: immediate,
  setInterval: interval,
  scheduler: {
    wait: (delay: number, options?: TimerOptions) => timeout(delay, undefined, options),
    yield: () => immediate(),
  },
};
