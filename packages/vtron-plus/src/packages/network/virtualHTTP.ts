import { Buffer } from 'buffer/';
import { ScriptEmitter } from '../node/scriptIO';
import { createScriptNet, type ScriptNetModule, type VirtualNetwork, type VirtualSocket, type VirtualServer } from './virtualNet';

type Headers = [string, string][];
export type VirtualHTTPRequest = { port: number; method: string; path: string; headers: Headers; body: Uint8Array };
export type VirtualHTTPResponse = { status: number; statusText: string; headers: Headers; body: Uint8Array };
export interface HTTPMessage extends ScriptEmitter {
  method: string; url: string; httpVersion: string; headers: Record<string, string>; rawHeaders: string[];
  complete: boolean; readable: boolean; socket: VirtualSocket; readonly connection: VirtualSocket;
  setEncoding(encoding: string): this;
  resume(): this;
  destroy(error?: Error): this;
}
export interface HTTPResponse extends ScriptEmitter {
  req: HTTPMessage; readonly socket: VirtualSocket;
  statusCode: number; statusMessage: string; headersSent: boolean; writableEnded: boolean; writableFinished: boolean;
  setHeader(name: string, value: string | number | string[]): this;
  getHeader(name: string): string | string[] | undefined;
  getHeaders(): Record<string, string | string[]>;
  getHeaderNames(): string[];
  hasHeader(name: string): boolean;
  removeHeader(name: string): void;
  writeHead(status: number, message?: string | Record<string, any>, headers?: Record<string, any>): this;
  write(chunk: string | Uint8Array, encoding?: string | (() => void), callback?: () => void): boolean;
  end(chunk?: string | Uint8Array | (() => void), encoding?: string | (() => void), callback?: () => void): this;
  destroy(error?: Error): this;
}
type RequestListener = (request: HTTPMessage, response: HTTPResponse) => unknown;
type ServerOptions = Record<string, unknown> | RequestListener;
export interface ScriptHTTPModule {
  Server: new(options?: ServerOptions, listener?: RequestListener) => VirtualServer;
  IncomingMessage: new(socket: VirtualSocket, method: string, url: string, headers: Headers) => HTTPMessage;
  ServerResponse: new(request: HTTPMessage) => HTTPResponse;
  createServer(options?: ServerOptions, listener?: RequestListener): VirtualServer;
  STATUS_CODES: Record<number, string>;
  METHODS: string[];
  request(): never;
  get(): never;
}
const statusCodes: Record<number, string> = { 200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content', 206: 'Partial Content', 301: 'Moved Permanently', 302: 'Found', 303: 'See Other', 304: 'Not Modified', 307: 'Temporary Redirect', 308: 'Permanent Redirect', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed', 409: 'Conflict', 413: 'Payload Too Large', 500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Timeout' };
const MAX_BODY = 16 * 1024 * 1024;
const MAX_HEADERS = 64 * 1024;
const unsupported = (message: string) => Object.assign(new Error(message), { code: 'ERR_NOT_SUPPORTED' });
function headerName(name: string) {
  if (typeof name !== 'string' || !/^[!#$%&'*+.^_`|~\w-]+$/.test(name)) throw new TypeError('Invalid HTTP header name');
  return name.toLowerCase();
}
function headerValue(value: unknown) {
  const text = String(value);
  if (/[\r\n\0]/.test(text)) throw new TypeError('Invalid HTTP header value');
  return text;
}
function bytes(value: string | Uint8Array, encoding = 'utf8'): Buffer {
  if (typeof value !== 'string' && !(value instanceof Uint8Array)) throw new TypeError('HTTP body must be a string or Uint8Array');
  return typeof value === 'string' ? Buffer.from(value, encoding as any) : Buffer.from(value);
}
function parseHead(head: string) {
  const [line, ...lines] = head.split('\r\n');
  const headers: Headers = lines.map(item => {
    const colon = item.indexOf(':');
    if (colon < 1) throw new Error('Malformed HTTP header');
    return [headerName(item.slice(0, colon)), headerValue(item.slice(colon + 1).trim())];
  });
  if (headers.some(([name]) => name === 'transfer-encoding')) throw unsupported('Chunked HTTP transfer is not supported by virtual HTTP');
  const lengths = headers.filter(([name]) => name === 'content-length');
  if (lengths.length > 1 || (lengths[0] && !/^\d+$/.test(lengths[0][1]))) throw new Error('Invalid Content-Length');
  const length = Number(lengths[0]?.[1] || 0);
  if (!Number.isSafeInteger(length) || length > MAX_BODY) throw new Error('HTTP body exceeds the 16 MiB virtual HTTP limit');
  return { line, headers, length };
}

/** A deliberately small, buffered HTTP/1.1 server over Vtron's virtual sockets. */
export function createScriptHTTP(net: ScriptNetModule, reportError: (error: unknown) => void): ScriptHTTPModule {
  class IncomingMessage extends ScriptEmitter {
    method: string;
    url: string;
    httpVersion = '1.1';
    headers: Record<string, string> = Object.create(null);
    rawHeaders: string[];
    complete = false;
    readable = true;
    private encoding?: string;
    constructor(public socket: any, method: string, url: string, headers: Headers) {
      super(reportError);
      this.method = method; this.url = url;
      this.rawHeaders = headers.flat();
      for (const [name, value] of headers) this.headers[name] = this.headers[name] ? this.headers[name] + ', ' + value : value;
    }
    get connection() { return this.socket; }
    setEncoding(encoding: string) { if (!Buffer.isEncoding(encoding)) throw new TypeError('Invalid encoding'); this.encoding = encoding; return this; }
    resume() { return this; }
    destroy(error?: Error) { this.socket.destroy(error); return this; }
    deliver(body: Buffer) {
      if (body.length) this.emit('data', this.encoding ? body.toString(this.encoding as any) : body);
      this.complete = true; this.readable = false; this.emit('end'); this.emit('close');
    }
  }
  class ServerResponse extends ScriptEmitter {
    statusCode = 200;
    statusMessage = '';
    headersSent = false;
    writableEnded = false;
    writableFinished = false;
    private headers = new Map<string, string | string[]>();
    private chunks: Buffer[] = [];
    private size = 0;
    constructor(public req: HTTPMessage) { super(reportError); }
    get socket() { return this.req.socket; }
    setHeader(name: string, value: string | number | string[]) {
      if (this.headersSent) throw new Error('Headers have already been sent');
      this.headers.set(headerName(name), Array.isArray(value) ? value.map(headerValue) : headerValue(value)); return this;
    }
    getHeader(name: string) { return this.headers.get(headerName(name)); }
    getHeaders() { return Object.fromEntries(this.headers); }
    getHeaderNames() { return [...this.headers.keys()]; }
    hasHeader(name: string) { return this.headers.has(headerName(name)); }
    removeHeader(name: string) { if (this.headersSent) throw new Error('Headers have already been sent'); this.headers.delete(headerName(name)); }
    writeHead(status: number, message?: string | Record<string, any>, headers?: Record<string, any>) {
      if (this.headersSent) throw new Error('Headers have already been sent');
      if (!Number.isInteger(status) || status < 200 || status > 599) throw new RangeError('Virtual HTTP supports final status codes 200-599');
      this.statusCode = status;
      if (typeof message === 'string') this.statusMessage = headerValue(message);
      for (const [name, value] of Object.entries(typeof message === 'object' ? message : headers || {})) this.setHeader(name, value);
      this.headersSent = true; return this;
    }
    write(chunk: string | Uint8Array, encoding?: string | (() => void), callback?: () => void) {
      if (this.writableEnded) throw new Error('write after end');
      const data = bytes(chunk, typeof encoding === 'string' ? encoding : undefined);
      this.size += data.length;
      if (this.size > MAX_BODY) throw new Error('HTTP body exceeds the 16 MiB virtual HTTP limit');
      this.chunks.push(data); this.headersSent = true;
      (typeof encoding === 'function' ? encoding : callback)?.(); return true;
    }
    end(chunk?: string | Uint8Array | (() => void), encoding?: string | (() => void), callback?: () => void) {
      if (this.writableEnded) return this;
      if (chunk !== undefined && typeof chunk !== 'function') this.write(chunk, typeof encoding === 'string' ? encoding : undefined);
      if (!Number.isInteger(this.statusCode) || this.statusCode < 200 || this.statusCode > 599) throw new RangeError('Invalid HTTP status code');
      this.writableEnded = true; this.headersSent = true;
      if (this.headers.has('transfer-encoding')) throw unsupported('Chunked HTTP transfer is not supported by virtual HTTP');
      const noBody = this.statusCode === 204 || this.statusCode === 304;
      const body = noBody ? Buffer.alloc(0) : Buffer.concat(this.chunks);
      const length = this.headers.get('content-length');
      if (length !== undefined && Number(length) !== body.length && this.req.method !== 'HEAD' && !noBody) throw new Error('Content-Length does not match response body');
      if (noBody) this.headers.delete('content-length');
      else if (length === undefined) this.headers.set('content-length', String(body.length));
      this.headers.set('connection', 'close');
      const head = `HTTP/1.1 ${this.statusCode} ${headerValue(this.statusMessage || statusCodes[this.statusCode] || 'Unknown')}\r\n` + [...this.headers].flatMap(([name, value]) => (Array.isArray(value) ? value : [value]).map(item => `${name}: ${item}\r\n`)).join('') + '\r\n';
      this.socket.end(Buffer.concat([Buffer.from(head), this.req.method === 'HEAD' ? Buffer.alloc(0) : body]));
      this.writableFinished = true; this.chunks = []; this.emit('finish');
      (typeof chunk === 'function' ? chunk : typeof encoding === 'function' ? encoding : callback)?.();
      return this;
    }
    destroy(error?: Error) { this.socket.destroy(error); return this; }
  }
  class Server extends net.Server {
    constructor(options?: ServerOptions, listener?: RequestListener) {
      if (options && typeof options === 'object' && Object.keys(options).length) throw unsupported('Virtual http.createServer currently supports the request listener only');
      super({ allowHalfOpen: true });
      this.on('connection', (socket: any) => {
        let buffer = Buffer.alloc(0); let handled = false;
        socket.on('error', (error: Error) => this.emit('clientError', error, socket));
        socket.on('data', (chunk: Buffer) => {
          if (handled) return;
          buffer = Buffer.concat([buffer, chunk]);
          try {
            const index = buffer.indexOf('\r\n\r\n');
            if (index < 0) { if (buffer.length > MAX_HEADERS) throw new Error('HTTP headers too large'); return; }
            if (index > MAX_HEADERS) throw new Error('HTTP headers too large');
            const parsed = parseHead(buffer.subarray(0, index).toString());
            const [method, url, version, extra] = parsed.line.split(' ');
            if (!/^[A-Z]+$/.test(method) || !url?.startsWith('/') || !/^HTTP\/1\.[01]$/.test(version) || extra) throw new Error('Invalid HTTP request line');
            if (buffer.length < index + 4 + parsed.length) return;
            handled = true;
            const req = new IncomingMessage(socket, method, url, parsed.headers);
            const res = new ServerResponse(req);
            const body = buffer.subarray(index + 4, index + 4 + parsed.length); buffer = Buffer.alloc(0);
            this.emit('request', req, res);
            queueMicrotask(() => req.deliver(Buffer.from(body)));
          } catch (error) {
            handled = true;
            if (this.listenerCount('clientError')) this.emit('clientError', error, socket);
            else socket.end('HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\nConnection: close\r\n\r\n');
          }
        });
      });
      const handler = typeof options === 'function' ? options : listener;
      if (handler) this.on('request', handler);
    }
    on(event: string, listener: (...args: any[]) => any): this {
      if (event !== 'request') return super.on(event, listener);
      return super.on(event, (...args: any[]) => {
        try { Promise.resolve(listener.apply(this, args)).catch(error => { args[1].destroy(); reportError(error); }); }
        catch (error) { args[1].destroy(); reportError(error); }
      });
    }
  }
  return { Server, IncomingMessage, ServerResponse, STATUS_CODES: { ...statusCodes }, METHODS: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], createServer: (options?: ConstructorParameters<typeof Server>[0], listener?: ConstructorParameters<typeof Server>[1]) => new Server(options, listener), request: () => { throw unsupported('http.request is not implemented; use fetch for HTTP clients'); }, get: () => { throw unsupported('http.get is not implemented; use fetch for HTTP clients'); } };
}

/** Browser preview requests use the same virtual socket transport as net.connect(). */
export async function requestVirtualHTTP(network: VirtualNetwork, request: VirtualHTTPRequest, signal?: AbortSignal): Promise<VirtualHTTPResponse> {
  if (signal?.aborted) throw signal.reason || new Error('HTTP request aborted');
  const client = createScriptNet(network, { track: p => p, reportError: () => {} });
  try {
    return await new Promise<VirtualHTTPResponse>((resolve, reject) => {
      const socket = client.module.connect({ port: request.port, host: 'localhost' });
      let buffer = Buffer.alloc(0); let finished = false;
      const finish = (error?: unknown, response?: VirtualHTTPResponse) => {
        if (finished) return; finished = true;
        signal?.removeEventListener('abort', abort); socket.destroy();
        if (error) reject(error); else resolve(response!);
      };
      const abort = () => finish(signal?.reason || new Error('HTTP request aborted'));
      signal?.addEventListener('abort', abort, { once: true });
      socket.on('error', (error: Error) => finish(error));
      socket.on('connect', () => {
        try {
          if (!/^[A-Z]+$/.test(request.method) || !request.path.startsWith('/') || /[\r\n\0 ]/.test(request.path)) throw new TypeError('Invalid HTTP request');
          const headers = request.headers.filter(([name]) => !['connection', 'content-length', 'transfer-encoding', 'host'].includes(name.toLowerCase())).map(([name, value]) => `${headerName(name)}: ${headerValue(value)}\r\n`).join('');
          if (request.body.length > MAX_BODY) throw new Error('HTTP request body too large');
          socket.write(Buffer.concat([Buffer.from(`${request.method} ${request.path} HTTP/1.1\r\nHost: localhost:${request.port}\r\n${headers}Content-Length: ${request.body.length}\r\nConnection: close\r\n\r\n`), Buffer.from(request.body)]));
        } catch (error) { finish(error); }
      });
      socket.on('data', (chunk: Buffer) => {
        try {
          buffer = Buffer.concat([buffer, chunk]);
          const index = buffer.indexOf('\r\n\r\n');
          if (index < 0) { if (buffer.length > MAX_HEADERS) throw new Error('HTTP headers too large'); return; }
          if (index > MAX_HEADERS) throw new Error('HTTP headers too large');
          const parsed = parseHead(buffer.subarray(0, index).toString());
          const match = /^HTTP\/1\.[01] (\d{3})(?: (.*))?$/.exec(parsed.line);
          if (!match) throw new Error('Invalid HTTP response');
          const status = Number(match[1]);
          const size = request.method === 'HEAD' || status === 204 || status === 304 ? 0 : parsed.length;
          if (buffer.length >= index + 4 + size) finish(undefined, { status, statusText: match[2] || '', headers: parsed.headers, body: new Uint8Array(buffer.subarray(index + 4, index + 4 + size)) });
        } catch (error) { finish(error); }
      });
      socket.on('end', () => { if (!finished) finish(new Error('Virtual HTTP response ended before its body was complete')); });
      socket.on('close', () => { if (!finished) finish(new Error('Virtual HTTP connection closed')); });
    });
  } finally { client.dispose(); }
}
