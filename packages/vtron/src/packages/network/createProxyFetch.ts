export interface ProxyFetchOptions {
  /** Proxy endpoint. Receives the original absolute URL in its `url` query parameter. */
  endpoint: string;
  /** Exact HTTP(S) origins, including scheme and optional port. Other requests stay direct. */
  allowedOrigins: readonly string[];
}

function httpURL(value: string, base?: string) {
  const url = new URL(value, base);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new TypeError('Proxy configuration requires HTTP(S) URLs without credentials');
  }
  return url;
}

function pageBase() {
  if (typeof document !== 'undefined') return document.baseURI;
  if (typeof location !== 'undefined') return location.href;
  return undefined;
}

function abortReason(signal: AbortSignal) {
  return signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
}

async function readBody(request: Request) {
  const signal = request.signal;
  if (signal.aborted) throw abortReason(signal);
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const cancel = () => { signal.removeEventListener('abort', cancel); reject(abortReason(signal)); };
    signal.addEventListener('abort', cancel, { once: true });
    void request.arrayBuffer().then(resolve, reject).finally(() => signal.removeEventListener('abort', cancel));
  });
}

/**
 * Rewrite allowlisted requests to a host-provided proxy, preserving the HTTP request.
 * The proxy must independently authorize destinations and return the upstream response.
 */
export function createProxyFetch(options: ProxyFetchOptions): typeof globalThis.fetch {
  if (!options || typeof options !== 'object' || typeof options.endpoint !== 'string' || !options.endpoint.trim()) {
    throw new TypeError('Proxy endpoint must be a non-empty string');
  }
  if (!Array.isArray(options.allowedOrigins)) throw new TypeError('allowedOrigins must be an array of HTTP(S) origins');
  const endpoint = options.endpoint;
  // A base is only used for validation; relative endpoints resolve against the host page when called.
  const checkedEndpoint = httpURL(endpoint, 'http://localhost');
  if (checkedEndpoint.hash || endpoint.includes('#')) throw new TypeError('Proxy endpoint must not contain a fragment');
  const allowedOrigins = new Set(options.allowedOrigins.map(value => {
    if (typeof value !== 'string') throw new TypeError('allowedOrigins must contain HTTP(S) origins');
    const origin = value.trim();
    const url = httpURL(origin);
    if (!/^https?:\/\/[^/?#]+\/?$/i.test(origin) || url.hostname.includes('*')) {
      throw new TypeError('allowedOrigins must contain exact origins without paths, queries, fragments or wildcards');
    }
    return url.origin;
  }));
  if (typeof globalThis.fetch !== 'function') throw new TypeError('Native fetch is not available');
  const nativeFetch = globalThis.fetch.bind(globalThis);

  return async (input, init) => {
    const base = pageBase();
    const original = new URL(input instanceof Request ? input.url : String(input), base);
    if (!allowedOrigins.has(original.origin)) return nativeFetch(input, init);

    const proxy = httpURL(endpoint, base);
    original.hash = '';
    proxy.searchParams.set('url', original.href);
    const request = new Request(input instanceof Request ? input : original, init);
    if (request.signal.aborted) throw abortReason(request.signal);
    // Buffer once so FormData/binary bodies keep their bytes and headers without a second stream upload.
    const body = request.body === null ? undefined : await readBody(request);
    const forwarded = new Request(proxy, {
      method: request.method,
      headers: request.headers,
      body,
      signal: request.signal,
      credentials: request.credentials,
      mode: request.mode,
      cache: request.cache,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      integrity: request.integrity,
      keepalive: request.keepalive,
    });
    return nativeFetch(forwarded);
  };
}
