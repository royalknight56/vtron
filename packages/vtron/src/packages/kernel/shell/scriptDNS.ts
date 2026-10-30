type Order = 'verbatim' | 'ipv4first' | 'ipv6first';
type Address = { address: string; family: 4 | 6 };
type Options = { family?: 0 | 4 | 6 | 'IPv4' | 'IPv6'; all?: boolean; order?: Order; verbatim?: boolean; hints?: number };
type Callback = (error: unknown, address?: string | Address[], family?: 4 | 6) => unknown;
type Track = <T>(promise: Promise<T>) => Promise<T>;

function invalid(code: string, message: string): never {
  throw Object.assign(new TypeError(message), { code });
}
function validOrder(value: unknown): Order {
  if (value !== 'verbatim' && value !== 'ipv4first' && value !== 'ipv6first') invalid('ERR_INVALID_ARG_VALUE', 'DNS order must be verbatim, ipv4first or ipv6first');
  return value;
}
export function ipFamily(hostname: string): 0 | 4 | 6 {
  const parts = hostname.split('.');
  if (parts.length === 4 && parts.every(part => /^(?:0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255)) return 4;
  const [address, zone, extra] = hostname.split('%');
  if (!address.includes(':') || !/^[0-9a-f:.]+$/i.test(address) || extra !== undefined || (zone !== undefined && !/^[\w.~\-]+$/.test(zone))) return 0;
  // The browser URL parser validates IPv6 syntax, including compressed and IPv4-mapped forms.
  try { new URL('http://[' + address + ']/'); return 6; } catch { return 0; }
}

/** Local-only lookup: localhost is a declared virtual mapping, not the host OS resolver. */
export function createScriptDNS(track: Track, reportError: (error: unknown) => void) {
  let defaultOrder: Order = 'verbatim';
  function parse(hostname: string, value: Options | number | undefined) {
    if (typeof hostname !== 'string') invalid('ERR_INVALID_ARG_TYPE', 'hostname must be a string');
    if (!hostname || hostname.includes('\0')) invalid('ERR_INVALID_ARG_VALUE', 'hostname must be non-empty and contain no null bytes');
    if (value !== undefined && typeof value !== 'number' && (!value || typeof value !== 'object' || Array.isArray(value))) invalid('ERR_INVALID_ARG_TYPE', 'lookup options must be an object or a family number');
    const options: Options = typeof value === 'number' ? { family: value as Options['family'] } : value ?? {};
    if (Object.keys(options).some(key => !['family', 'all', 'order', 'verbatim', 'hints'].includes(key)) || (options.hints !== undefined && options.hints !== 0)) {
      throw Object.assign(new Error('DNS lookup only supports family, all, order, verbatim and hints: 0'), { code: 'ERR_NOT_SUPPORTED' });
    }
    const family = options.family === 'IPv4' ? 4 : options.family === 'IPv6' ? 6 : options.family ?? 0;
    if (family !== 0 && family !== 4 && family !== 6) invalid('ERR_INVALID_ARG_VALUE', 'family must be 0, 4, 6, IPv4 or IPv6');
    if (options.all !== undefined && typeof options.all !== 'boolean') invalid('ERR_INVALID_ARG_TYPE', 'all must be a boolean');
    if (options.verbatim !== undefined && typeof options.verbatim !== 'boolean') invalid('ERR_INVALID_ARG_TYPE', 'verbatim must be a boolean');
    const order = options.order !== undefined ? validOrder(options.order) : options.verbatim === undefined ? defaultOrder : options.verbatim ? 'verbatim' : 'ipv4first';
    return { family, order, all: options.all ?? false };
  }
  function addresses(hostname: string, options: ReturnType<typeof parse>): Address[] {
    const family = ipFamily(hostname);
    // Like Node, IP literals bypass hostname resolution and retain their actual family.
    if (family) return [{ address: hostname, family }];
    if (!['localhost', 'localhost.'].includes(hostname.toLowerCase())) {
      throw Object.assign(new Error(`DNS lookup for '${hostname}' is not supported; only localhost and IP literals are available in the Vtron browser runtime`), { code: 'ERR_NOT_SUPPORTED', hostname, syscall: 'getaddrinfo' });
    }
    const result: Address[] = [{ address: '127.0.0.1', family: 4 }, { address: '::1', family: 6 }];
    if (options.order === 'ipv6first') result.reverse();
    return options.family ? result.filter(item => item.family === options.family) : result;
  }
  const lookupPromise = (hostname: string, options?: Options | number) => track((async () => {
    const parsed = parse(hostname, options);
    const result = addresses(hostname, parsed);
    return parsed.all ? result : result[0];
  })());
  function lookup(hostname: string, options: Options | number | Callback, callback?: Callback): void;
  function lookup(hostname: string, callback: Callback): void;
  function lookup(hostname: string, options?: Options | number | Callback, callback?: Callback): void {
    if (typeof options === 'function') { callback = options; options = undefined; }
    if (typeof callback !== 'function') invalid('ERR_INVALID_ARG_TYPE', 'lookup requires a callback; use dns.promises.lookup() with await');
    const parsed = parse(hostname, options);
    const done = callback;
    const task = Promise.resolve().then(() => addresses(hostname, parsed)).then(
      result => parsed.all ? done(null, result) : done(null, result[0].address, result[0].family),
      error => done(error)
    ).catch(reportError);
    track(task);
  }
  Object.defineProperty(lookup, Symbol.for('nodejs.util.promisify.custom'), { value: lookupPromise, configurable: true });
  const getDefaultResultOrder = () => defaultOrder;
  const setDefaultResultOrder = (order: Order) => { defaultOrder = validOrder(order); };
  const promises = { lookup: lookupPromise, getDefaultResultOrder, setDefaultResultOrder };
  return { lookup, getDefaultResultOrder, setDefaultResultOrder, promises };
}
