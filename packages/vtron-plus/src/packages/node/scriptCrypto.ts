import { sha256, sha384, sha512 } from '@noble/hashes/sha2.js';
import { sha1 } from '@noble/hashes/legacy.js';
import { type CHash } from '@noble/hashes/utils.js';
import { Buffer } from './scriptBuffer';

type HashInput = string | ArrayBufferView;
type RandomCallback = (error: unknown, value?: Buffer) => unknown;
type Hooks = { track?: <T>(promise: Promise<T>) => Promise<T>; reportError?: (error: unknown) => void; isActive?: () => boolean };
export interface ScriptHash {
  update(data: HashInput, inputEncoding?: string): this;
  digest(encoding?: string): Buffer | string;
  copy(options?: Record<string, unknown>): ScriptHash;
}
const algorithms = new Map<string, CHash>([['sha256', sha256], ['sha384', sha384], ['sha512', sha512]]);
const incrementalAlgorithms = new Map<string, CHash>([['sha1', sha1], ...algorithms]);

function cryptoError(code: string, message: string, type: typeof Error = Error) {
  return Object.assign(new type(message), { code });
}
function unsupported(name: string): never {
  throw cryptoError('ERR_NOT_SUPPORTED', `${name} is not supported by the Vtron browser runtime`);
}
function algorithmOf(algorithm: string, incremental = false): CHash {
  if (typeof algorithm !== 'string') throw cryptoError('ERR_INVALID_ARG_TYPE', 'Hash algorithm must be a string', TypeError);
  const name = algorithm.toLowerCase().replace(/^sha-/, 'sha');
  const available = incremental ? incrementalAlgorithms : algorithms;
  const digest = available.get(name);
  if (!digest) throw cryptoError('ERR_CRYPTO_INVALID_DIGEST', `Unsupported hash algorithm: ${algorithm}; supported: ${[...available.keys()].join(', ')}`);
  return digest;
}
function outputEncoding(encoding: unknown): string {
  if (typeof encoding !== 'string') throw cryptoError('ERR_INVALID_ARG_TYPE', 'outputEncoding must be a string', TypeError);
  const format = encoding.toLowerCase();
  if (!['hex', 'base64', 'base64url', 'buffer'].includes(format)) throw cryptoError('ERR_UNKNOWN_ENCODING', `Unsupported hash output encoding: ${encoding}`);
  return format;
}
function formatDigest(bytes: Uint8Array, encoding: string) {
  const result = Buffer.from(bytes);
  if (encoding === 'buffer') return result;
  if (encoding === 'base64url') return result.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return result.toString(encoding as 'hex' | 'base64');
}
function inputBytes(data: HashInput, encoding?: string): Uint8Array {
  if (typeof data === 'string') {
    if (encoding === undefined) return new TextEncoder().encode(data);
    if (typeof encoding !== 'string') throw cryptoError('ERR_INVALID_ARG_TYPE', 'inputEncoding must be a string', TypeError);
    if (encoding.toLowerCase() === 'base64url') return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    if (!Buffer.isEncoding(encoding)) throw cryptoError('ERR_UNKNOWN_ENCODING', `Unsupported hash input encoding: ${encoding}`);
    return Buffer.from(data, encoding as any);
  }
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  throw cryptoError('ERR_INVALID_ARG_TYPE', 'Hash data must be a string, TypedArray or DataView', TypeError);
}
function optionsOf(options: unknown, name: string) {
  if (options === undefined) return;
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw cryptoError('ERR_INVALID_ARG_TYPE', `${name} options must be an object`, TypeError);
  if (Object.keys(options).length) unsupported(`${name} options`);
}
function hashInstance(state: ReturnType<CHash['create']>): ScriptHash {
  let finalized = false;
  const active = () => { if (finalized) throw cryptoError('ERR_CRYPTO_HASH_FINALIZED', 'Digest already called'); };
  const hash: ScriptHash = {
    update(data, encoding) { active(); state.update(inputBytes(data, encoding)); return hash; },
    digest(encoding = 'buffer') {
      active();
      const format = outputEncoding(encoding);
      finalized = true;
      return formatDigest(state.digest(), format);
    },
    copy(options) { active(); optionsOf(options, 'Hash.copy'); return hashInstance(state.clone()); },
  };
  return hash;
}

/** Browser crypto primitives only; Node certificates and constant-time comparisons are not emulated. */
export function createScriptCrypto(hooks: Hooks = {}) {
  const webCrypto = () => {
    if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== 'function') unsupported('Web Crypto secure randomness');
    return globalThis.crypto;
  };
  const generate = (size: number) => {
    const output = Buffer.alloc(size);
    const crypto = webCrypto();
    for (let offset = 0; offset < output.length; offset += 65536) crypto.getRandomValues(output.subarray(offset, Math.min(output.length, offset + 65536)));
    return output;
  };
  function randomBytes(size: number): Buffer;
  function randomBytes(size: number, callback: RandomCallback): void;
  function randomBytes(size: number, callback?: RandomCallback): Buffer | void {
    if (typeof size !== 'number') throw cryptoError('ERR_INVALID_ARG_TYPE', 'size must be a number', TypeError);
    if (!Number.isFinite(size) || size < 0 || size > 0x7fffffff) throw cryptoError('ERR_OUT_OF_RANGE', 'size must be between 0 and 2147483647', RangeError);
    if (callback !== undefined && typeof callback !== 'function') throw cryptoError('ERR_INVALID_ARG_TYPE', 'callback must be a function', TypeError);
    const length = Math.floor(size);
    if (callback === undefined) return generate(length);
    const task = Promise.resolve().then(() => {
      if (hooks.isActive && !hooks.isActive()) return;
      let value: Buffer;
      try { value = generate(length); }
      catch (error) { return callback(error); }
      return callback(null, value);
    }).catch(error => {
      if (hooks.isActive && !hooks.isActive()) return;
      if (hooks.reportError) hooks.reportError(error);
      else queueMicrotask(() => { throw error; });
    });
    hooks.track?.(task);
  }
  return {
    hash(algorithm: string, data: HashInput, options: string | { outputEncoding?: string } = 'hex') {
      const digest = algorithmOf(algorithm);
      if (typeof options !== 'string' && (!options || typeof options !== 'object' || Array.isArray(options))) throw cryptoError('ERR_INVALID_ARG_TYPE', 'Hash options must be an encoding string or an object', TypeError);
      if (typeof options === 'object' && Object.keys(options).some(key => key !== 'outputEncoding')) unsupported('crypto.hash options other than outputEncoding');
      const encoding = outputEncoding(typeof options === 'string' ? options : options.outputEncoding ?? 'hex');
      return formatDigest(digest(inputBytes(data)), encoding);
    },
    createHash(algorithm: string, options?: Record<string, unknown>) {
      const digest = algorithmOf(algorithm, true);
      optionsOf(options, 'crypto.createHash');
      return hashInstance(digest.create());
    },
    randomBytes,
    getRandomValues<T extends ArrayBufferView>(array: T): T { return webCrypto().getRandomValues(array as any) as unknown as T; },
    randomUUID(options?: Record<string, unknown>) {
      optionsOf(options, 'crypto.randomUUID');
      const crypto = webCrypto();
      if (typeof crypto.randomUUID !== 'function') unsupported('crypto.randomUUID');
      return crypto.randomUUID();
    },
    timingSafeEqual: (..._args: unknown[]): never => unsupported('crypto.timingSafeEqual (constant-time comparison is unavailable in JavaScript)'),
    X509Certificate: class X509Certificate {
      constructor(_certificate: unknown) { unsupported('crypto.X509Certificate'); }
    },
  };
}

// Kept for direct internal consumers; script executions create their own callback hooks.
export const scriptCrypto = createScriptCrypto();
