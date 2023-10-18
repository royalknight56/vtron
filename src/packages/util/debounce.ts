export function throttle<F extends (...args: any[]) => any>(
  func: F,
  delay: number
): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastRun = 0;
  return function (this: unknown, ...args: Parameters<F>) {
    if (timeout) {
      return;
    }
    const elapsed = Date.now() - lastRun;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    function end() {
      timeout = null;
      lastRun = Date.now();
      func.apply(context, args);
    }
    if (elapsed >= delay) {
      end();
    } else {
      timeout = setTimeout(end, delay - elapsed);
    }
  };
}
export function debounce<F extends (...args: any[]) => any>(
  fn: F,
  delay: number
): (...args: Parameters<F>) => void {
  let timer: NodeJS.Timeout | null = null;
  return (...args: Parameters<F>) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
