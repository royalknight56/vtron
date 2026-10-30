import { Buffer } from './scriptBuffer';
import { scriptIsDeepStrictEqual } from './scriptDeepEqual';
import { createScriptStyleText, type StyleTextHooks } from './scriptStyleText';

type InspectOptions = {
  depth?: number | null;
  colors?: boolean;
  showHidden?: boolean;
  customInspect?: boolean;
  getters?: false;
  sorted?: boolean;
  maxArrayLength?: number | null;
  maxStringLength?: number | null;
  compact?: true;
  breakLength?: number;
};
type Settings = { depth: number | null; colors: boolean; showHidden: boolean; customInspect: boolean; sorted: boolean; maxArrayLength: number; maxStringLength: number };
const custom = Symbol.for('nodejs.util.inspect.custom');

function unsupported(feature: string): never {
  throw Object.assign(new Error(`${feature} is not supported by the Vtron util adapter`), { code: 'ERR_NOT_SUPPORTED' });
}
function invalid(message: string): never {
  throw Object.assign(new TypeError(message), { code: 'ERR_INVALID_ARG_TYPE' });
}
function settings(options?: InspectOptions): Settings {
  if (options === undefined) options = {};
  if (!options || typeof options !== 'object' || Array.isArray(options)) invalid('inspect options must be an object');
  for (const key of Object.keys(options)) if (!['depth', 'colors', 'showHidden', 'customInspect', 'getters', 'sorted', 'maxArrayLength', 'maxStringLength', 'compact', 'breakLength'].includes(key)) unsupported(`util.inspect option ${key}`);
  for (const key of ['colors', 'showHidden', 'customInspect', 'sorted'] as const) if (options[key] !== undefined && typeof options[key] !== 'boolean') invalid(`inspect.${key} must be a boolean`);
  if (options.depth !== undefined && options.depth !== null && (!Number.isInteger(options.depth) || !Number.isFinite(options.depth))) invalid('inspect.depth must be an integer or null');
  if (options.getters !== undefined && options.getters !== false) unsupported('util.inspect getters');
  if (options.compact !== undefined && options.compact !== true) unsupported('util.inspect compact modes other than true');
  if (options.breakLength !== undefined && options.breakLength !== Infinity) unsupported('util.inspect line wrapping');
  for (const key of ['maxArrayLength', 'maxStringLength'] as const) if (options[key] !== undefined && options[key] !== null && (!Number.isInteger(options[key]) || options[key]! < 0)) invalid(`inspect.${key} must be a non-negative integer or null`);
  return { depth: options.depth === undefined ? 2 : options.depth, colors: options.colors ?? false, showHidden: options.showHidden ?? false, customInspect: options.customInspect ?? true, sorted: options.sorted ?? false, maxArrayLength: options.maxArrayLength ?? (options.maxArrayLength === null ? Infinity : 100), maxStringLength: options.maxStringLength ?? (options.maxStringLength === null ? Infinity : 10000) };
}
function quoted(value: string): string {
  const quote = !value.includes("'") ? "'" : !value.includes('"') ? '"' : !value.includes('`') && !value.includes('${') ? '`' : "'";
  const text = value.replace(/[\\\x00-\x1f\x7f-\x9f]/g, character => {
    const escapes: Record<string, string> = { '\\': '\\\\', '\n': '\\n', '\r': '\\r', '\t': '\\t', '\b': '\\b', '\f': '\\f', '\v': '\\v' };
    return escapes[character] || '\\x' + character.charCodeAt(0).toString(16).padStart(2, '0');
  });
  return quote + text.replaceAll(quote, '\\' + quote) + quote;
}

/** A bounded diagnostic formatter, not the full Node inspector or debugger. */
export function createScriptUtilFormat(hooks: StyleTextHooks = {}) {
  const styling = createScriptStyleText(hooks);
  function inspect(value: unknown, options?: InspectOptions): string {
    const opts = settings(options);
    const ancestors = new Map<object, { id?: number }>();
    let nextId = 1;
    const style = (text: string, code: number) => opts.colors ? `\x1b[${code}m${text}\x1b[${code === 1 ? 22 : 39}m` : text;
    const keyText = (key: PropertyKey, hidden: boolean) => {
      const text = typeof key === 'symbol' ? `[${style(String(key), 32)}]` : hidden ? `[${key}]` : /^[\p{ID_Start}_$][\p{ID_Continue}$]*$/u.test(String(key)) ? String(key) : style(quoted(String(key)), 32);
      return text;
    };
    const errorText = (error: Error, stack: boolean) => {
      const data = (key: string) => {
        for (let current: object | null = error; current; current = Object.getPrototypeOf(current)) {
          const descriptor = Object.getOwnPropertyDescriptor(current, key);
          if (!descriptor) continue;
          if ('value' in descriptor) return descriptor.value;
          // V8 can expose its lazy Error stack through a native getter. Custom
          // getters remain unexecuted, like ordinary inspected properties.
          if (key === 'stack' && descriptor.get && Function.prototype.toString.call(descriptor.get).includes('[native code]')) return descriptor.get.call(error);
          return;
        }
      };
      const trace = stack ? data('stack') : undefined;
      if (typeof trace === 'string' && trace) return trace;
      const name = data('name'), message = data('message');
      return `${typeof name === 'string' ? name : 'Error'}${typeof message === 'string' && message ? ': ' + message : ''}`;
    };
    const render = (item: unknown, depth: number | null): string => {
      if (item === null) return style('null', 1);
      if (typeof item === 'string') {
        const text = item.slice(0, opts.maxStringLength);
        return style(quoted(text), 32) + (text.length < item.length ? `... ${item.length - text.length} more character${item.length - text.length === 1 ? '' : 's'}` : '');
      }
      if (typeof item === 'undefined') return style('undefined', 90);
      if (typeof item === 'number') return style(Object.is(item, -0) ? '-0' : String(item), 33);
      if (typeof item === 'bigint') return style(String(item) + 'n', 33);
      if (typeof item === 'boolean') return style(String(item), 33);
      if (typeof item === 'symbol') return style(String(item), 32);
      if (typeof item === 'function') {
        if (opts.showHidden || Reflect.ownKeys(item).some(key => Object.getOwnPropertyDescriptor(item, key)?.enumerable)) unsupported('util.inspect function properties');
        const kind = Object.prototype.toString.call(item).slice(8, -1);
        return style(`[${kind}${item.name ? ': ' + item.name : ' (anonymous)'}]`, 36);
      }
      const object = item as object;
      if (Buffer.isBuffer(object)) {
        if (opts.showHidden) unsupported('util.inspect hidden Buffer internals');
        const data = object as Buffer;
        const limit = Math.min(data.length, 50);
        const hex = [...data.subarray(0, limit)].map(byte => byte.toString(16).padStart(2, '0')).join(' ');
        return `<Buffer${hex ? ' ' + hex : ''}${data.length > limit ? ` ... ${data.length - limit} more byte${data.length - limit === 1 ? '' : 's'}` : ''}>`;
      }
      if (opts.customInspect && custom in object) unsupported('util.inspect custom inspector callbacks');
      const errorObject = object instanceof Error;
      if (object instanceof Date) return style(Number.isNaN(object.getTime()) ? 'Invalid Date' : object.toISOString(), 35);
      if (object instanceof RegExp) return style(String(object), 31);
      const array = Array.isArray(object);
      const map = object instanceof Map;
      const set = object instanceof Set;
      const prototype = Object.getPrototypeOf(object);
      if (!errorObject && !array && !map && !set && prototype !== Object.prototype && prototype !== null) unsupported('util.inspect this object type');
      const ancestor = ancestors.get(object);
      if (ancestor) {
        ancestor.id ??= nextId++;
        return style(`[Circular *${ancestor.id}]`, 36);
      }
      if (depth !== null && depth < 0) {
        if (errorObject) return style(`[${errorText(object as Error, false)}]`, 36);
        const keys = Reflect.ownKeys(object).filter(key => opts.showHidden || Object.getOwnPropertyDescriptor(object, key)?.enumerable);
        if (array && object.length === 0 && !keys.length) return '[]';
        if (map && !object.size && !keys.length) return 'Map(0) {}';
        if (set && !object.size && !keys.length) return 'Set(0) {}';
        if (!array && !map && !set && !keys.length) return prototype === null ? '[Object: null prototype] {}' : '{}';
        return style(array ? '[Array]' : map ? '[Map]' : set ? '[Set]' : prototype === null ? '[Object: null prototype]' : '[Object]', 36);
      }
      const reference: { id?: number } = {};
      ancestors.set(object, reference);
      const childDepth = depth === null ? null : depth - 1;
      let result: string;
      const properties = (skip: (key: PropertyKey) => boolean = () => false): string[] => {
        let keys = Reflect.ownKeys(object).filter(key => !skip(key) && (opts.showHidden || Object.getOwnPropertyDescriptor(object, key)?.enumerable || errorObject && (key === 'cause' || key === 'errors')));
        if (opts.sorted) keys = keys.sort((a, b) => String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0);
        return keys.map(key => {
          const descriptor = Object.getOwnPropertyDescriptor(object, key)!;
          const value = 'value' in descriptor ? render(descriptor.value, childDepth) : style(descriptor.get ? descriptor.set ? '[Getter/Setter]' : '[Getter]' : '[Setter]', 36);
          return keyText(key, !descriptor.enumerable) + ': ' + value;
        });
      };
      if (errorObject) {
        const values = properties(key => !opts.showHidden && (key === 'stack' || key === 'message' || key === 'name'));
        result = errorText(object as Error, true) + (values.length ? ' { ' + values.join(', ') + ' }' : '');
      } else if (array) {
        const values: string[] = [];
        const length = Math.min(object.length, opts.maxArrayLength);
        for (let index = 0; index < length;) {
          if (Object.prototype.hasOwnProperty.call(object, index)) { values.push(render(object[index], childDepth)); index++; }
          else { let end = index + 1; while (end < length && !Object.prototype.hasOwnProperty.call(object, end)) end++; values.push(style(`<${end - index} empty item${end - index === 1 ? '' : 's'}>`, 90)); index = end; }
        }
        if (length < object.length) values.push(`... ${object.length - length} more item${object.length - length === 1 ? '' : 's'}`);
        values.push(...properties(key => typeof key === 'string' && /^(?:0|[1-9]\d*)$/.test(key) && Number(key) < object.length));
        result = values.length ? '[ ' + values.join(', ') + ' ]' : '[]';
      } else if (map || set) {
        if (opts.showHidden || Object.keys(object).length) unsupported('util.inspect collection properties');
        let values = map ? [...object.entries()].map(([key, entry]) => render(key, childDepth) + ' => ' + render(entry, childDepth)) : [...object.values()].map(entry => render(entry, childDepth));
        const size = values.length;
        if (opts.sorted) values.sort();
        if (values.length > opts.maxArrayLength) values = [...values.slice(0, opts.maxArrayLength), `... ${size - opts.maxArrayLength} more items`];
        result = `${map ? 'Map' : 'Set'}(${size}) {${values.length ? ' ' + values.join(', ') + ' ' : ''}}`;
      } else {
        const values = properties();
        result = (prototype === null ? '[Object: null prototype] ' : '') + (values.length ? '{ ' + values.join(', ') + ' }' : '{}');
      }
      ancestors.delete(object);
      return (reference.id ? style(`<ref *${reference.id}>`, 36) + ' ' : '') + result;
    };
    return render(value, opts.depth);
  }
  Object.defineProperty(inspect, 'custom', { value: custom });

  function formatWithOptions(options: InspectOptions, ...args: unknown[]): string {
    if (options === undefined) invalid('formatWithOptions requires an options object');
    settings(options);
    if (!args.length) return '';
    if (typeof args[0] !== 'string') return args.map(value => typeof value === 'string' ? value : inspect(value, options)).join(' ');
    const first = args[0];
    if (args.length === 1) return first;
    let index = 1;
    const result = first.replace(/%[%sdifjoO]/g, token => {
      if (token === '%%') return '%';
      if (index >= args.length) return token;
      const value = args[index++];
      switch (token) {
        case '%s':
          if (typeof value === 'object' && value !== null) {
            const toString = Reflect.get(value, 'toString');
            if (typeof toString === 'function' && !Function.prototype.toString.call(toString).includes('[native code]')) return String(value);
            return inspect(value, { ...options, depth: 0, colors: false });
          }
          return typeof value === 'bigint' ? String(value) + 'n' : Object.is(value, -0) ? '-0' : String(value);
        case '%d': {
          if (typeof value === 'bigint') return String(value) + 'n';
          const number = typeof value === 'symbol' ? NaN : Number(value);
          return Object.is(number, -0) ? '-0' : String(number);
        }
        case '%i': return typeof value === 'bigint' ? String(value) + 'n' : typeof value === 'symbol' ? 'NaN' : String(parseInt(String(value), 10));
        case '%f': return typeof value === 'symbol' ? 'NaN' : String(parseFloat(String(value)));
        case '%j': {
          try { return JSON.stringify(value) ?? 'undefined'; }
          catch (error) { if (error instanceof TypeError && /circular|cyclic/i.test(error.message)) return '[Circular]'; throw error; }
        }
        case '%o': return inspect(value, { ...options, showHidden: true, depth: 4 });
        default: return inspect(value, options);
      }
    });
    const rest = args.slice(index).map(value => typeof value === 'string' ? value : inspect(value, options));
    return result + (rest.length ? ' ' + rest.join(' ') : '');
  }
  const format = (...args: unknown[]) => formatWithOptions({}, ...args);
  const stripVTControlCharacters = (value: string) => {
    if (typeof value !== 'string') invalid('stripVTControlCharacters input must be a string');
    // CSI, OSC (including OSC hyperlinks), and common single escape sequences.
    return value.replace(/(?:\x1b\][\s\S]*?(?:\x07|\x1b\\)|[\x1b\x9b][[\]()#;?]*(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d/#&.:=?%@~_]*)*)?\x07|(?:\d{1,4}(?:[;:]\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g, '');
  };
  return {
    inspect: Object.assign(inspect, { colors: styling.colors }) as typeof inspect & { custom: symbol; colors: typeof styling.colors }, styleText: styling.styleText, format, formatWithOptions, stripVTControlCharacters,
    isDeepStrictEqual: scriptIsDeepStrictEqual,
    debuglog: (..._args: unknown[]): never => unsupported('util.debuglog'),
    deprecate: (..._args: unknown[]): never => unsupported('util.deprecate'),
  };
}
