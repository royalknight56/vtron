/** Strict comparison of configuration data. Exotic objects and cycles need a
 * separate implementation and must not be guessed equal or unequal. */
export function scriptIsDeepStrictEqual(actual: unknown, expected: unknown): boolean {
  const active = new Set<object>();
  const unsupported = (): never => { throw Object.assign(new Error('util.isDeepStrictEqual currently supports primitives, plain objects and arrays without cycles'), { code: 'ERR_NOT_SUPPORTED' }); };
  const equal = (a: unknown, b: unknown): boolean => {
    if (Object.is(a, b)) return true;
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== Object.getPrototypeOf(b)) return false;
    if (proto !== Object.prototype && proto !== null && proto !== Array.prototype) return unsupported();
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a) && a.length !== (b as unknown[]).length) return false;
    if (active.has(a) || active.has(b)) return unsupported();
    const keys = (value: object) => Reflect.ownKeys(value).filter(key => Object.prototype.propertyIsEnumerable.call(value, key));
    const aKeys = keys(a), bKeys = keys(b);
    if (aKeys.length !== bKeys.length) return false;
    active.add(a); active.add(b);
    try {
      return aKeys.every(key => Object.prototype.propertyIsEnumerable.call(b, key) && equal(Reflect.get(a, key), Reflect.get(b, key)));
    } finally { active.delete(a); active.delete(b); }
  };
  return equal(actual, expected);
}
