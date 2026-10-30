import { Buffer } from 'buffer/';

type Encoder = (value: string) => string;
type ParseOptions = { maxKeys?: number; decodeURIComponent?: Encoder };
type StringifyOptions = { encodeURIComponent?: Encoder };

function optionsOf(value: unknown, names: string[]) {
  if (value === undefined || value === null) return;
  if (typeof value !== 'object' || Array.isArray(value)) throw new TypeError('querystring options must be an object');
  if (Object.keys(value).some(key => !names.includes(key))) throw Object.assign(new Error('Unsupported querystring option'), { code: 'ERR_NOT_SUPPORTED' });
}

function hex(code: number) {
  if (code >= 48 && code <= 57) return code - 48;
  if (code >= 65 && code <= 70) return code - 55;
  if (code >= 97 && code <= 102) return code - 87;
  return -1;
}

/** Tolerant percent decoding, matching Node's byte fallback for malformed input. */
function unescapeBuffer(value: string, decodeSpaces = false) {
  if (typeof value !== 'string') throw new TypeError('querystring.unescapeBuffer requires a string');
  const output = Buffer.allocUnsafe(value.length);
  let offset = 0;
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (decodeSpaces && code === 43) output[offset++] = 32;
    else if (code === 37 && index + 2 < value.length && hex(value.charCodeAt(index + 1)) >= 0 && hex(value.charCodeAt(index + 2)) >= 0) {
      output[offset++] = hex(value.charCodeAt(index + 1)) * 16 + hex(value.charCodeAt(index + 2));
      index += 2;
    } else output[offset++] = code;
  }
  return output.subarray(0, offset);
}

export function createScriptQuerystring() {
  const decoder = new TextDecoder('utf-8');
  const escape = (value: string) => encodeURIComponent(value);
  const unescape = (value: string, decodeSpaces = false) => {
    try { return decodeURIComponent(value); }
    catch { return decoder.decode(unescapeBuffer(value, decodeSpaces)); }
  };
  function parse(value: unknown, separator = '&', equals = '=', options?: ParseOptions) {
    optionsOf(options, ['maxKeys', 'decodeURIComponent']);
    const result: Record<string, string | string[]> = Object.create(null);
    if (typeof value !== 'string' || !value) return result;
    const decode = options?.decodeURIComponent ?? module.unescape;
    if (typeof decode !== 'function') throw new TypeError('decodeURIComponent must be a function');
    const max = typeof options?.maxKeys === 'number' ? options.maxKeys : 1000;
    const limit = Number.isInteger(max) && max > 0 ? max : Infinity;
    const sep = typeof separator === 'string' && separator ? separator : '&';
    const eq = typeof equals === 'string' && equals ? equals : '=';
    const decodePart = (part: string) => {
      const text = part.replace(/\+/g, '%20');
      try { return decode(text); } catch { return unescape(text); }
    };
    const entries = value.split(sep);
    for (let index = 0; index < Math.min(entries.length, limit); index++) {
      if (!entries[index]) continue;
      const at = entries[index].indexOf(eq);
      const key = decodePart(at < 0 ? entries[index] : entries[index].slice(0, at));
      const item = decodePart(at < 0 ? '' : entries[index].slice(at + eq.length));
      if (!Object.prototype.hasOwnProperty.call(result, key)) result[key] = item;
      else { const previous = result[key]; if (Array.isArray(previous)) previous.push(item); else result[key] = [previous, item]; }
    }
    return result;
  }
  function stringify(value: unknown, separator = '&', equals = '=', options?: StringifyOptions) {
    optionsOf(options, ['encodeURIComponent']);
    if (!value || typeof value !== 'object') return '';
    const encode = options?.encodeURIComponent ?? module.escape;
    if (typeof encode !== 'function') throw new TypeError('encodeURIComponent must be a function');
    const primitive = (item: unknown) => typeof item === 'string' || typeof item === 'boolean' || typeof item === 'bigint' || (typeof item === 'number' && Number.isFinite(item)) ? String(item) : '';
    const sep = typeof separator === 'string' && separator ? separator : '&';
    const eq = typeof equals === 'string' && equals ? equals : '=';
    const result: string[] = [];
    for (const key of Object.keys(value)) {
      const item = (value as Record<string, unknown>)[key];
      const prefix = encode(key) + eq;
      for (const entry of Array.isArray(item) ? item : [item]) result.push(prefix + encode(primitive(entry)));
    }
    return result.join(sep);
  }
  const module = { parse, decode: parse, stringify, encode: stringify, escape, unescape, unescapeBuffer };
  return module;
}
