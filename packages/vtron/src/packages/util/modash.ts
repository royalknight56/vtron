export function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const ret: any = {};
  keys.forEach((key) => {
    ret[key] = obj[key];
  });
  return ret;
}

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
export function uniqBy<T>(arr: T[], fn: (item: T) => any): T[] {
  const set = new Set();
  return arr.filter((item) => {
    const val = fn(item);
    if (set.has(val)) {
      return false;
    }
    set.add(val);
    return true;
  });
}
export function isNil(val: any): val is null | undefined {
  return val === null || val === undefined;
}
