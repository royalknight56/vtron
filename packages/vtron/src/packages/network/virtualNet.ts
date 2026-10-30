import { Buffer } from 'buffer/';
import { ScriptEmitter } from '../kernel/shell/scriptIO';
import { ipFamily } from '../kernel/shell/scriptDNS';

type Callback = (...args: any[]) => void;
type Hooks = { track: <T>(promise: Promise<T>) => Promise<T>; reportError: (error: unknown) => void };
export type VirtualAddress = { address: string; family: 'IPv4' | 'IPv6'; port: number };
type Address = VirtualAddress;
type ServerOptions = { allowHalfOpen?: boolean };

export interface VirtualServer extends ScriptEmitter {
  listening: boolean;
  listen(...args: any[]): this;
  address(): VirtualAddress | null;
  close(callback?: Callback): this;
  getConnections(callback: (error: null, count: number) => void): void;
  ref(): this;
  unref(): this;
}

export interface ScriptNetModule {
  Server: new (options?: ServerOptions | Callback, listener?: Callback) => VirtualServer;
  Socket: new (options?: ServerOptions) => VirtualSocket;
  createServer: (options?: ServerOptions | Callback, listener?: Callback) => VirtualServer;
  connect: (...args: any[]) => VirtualSocket;
  createConnection: (...args: any[]) => VirtualSocket;
  isIP: (value: unknown) => 0 | 4 | 6;
  isIPv4: (value: unknown) => boolean;
  isIPv6: (value: unknown) => boolean;
}
type Binding = { host: string; accept: (client: VirtualSocket) => void };

function netError(code: string, message: string, port?: number) {
  return Object.assign(new Error(message), { code, port, syscall: 'virtual net' });
}
function unsupported(operation: string): never {
  throw netError('ERR_NOT_SUPPORTED', `${operation} is not supported by the Vtron virtual network`);
}
function localHost(host: unknown, listen = false): string {
  if (host === undefined) return listen ? '::' : 'localhost';
  if (typeof host !== 'string') throw new TypeError('host must be a string');
  const value = host.toLowerCase();
  if (['localhost', 'localhost.', '127.0.0.1', '::1'].includes(value) || (listen && ['0.0.0.0', '::'].includes(value))) return value;
  return unsupported(`Connecting or binding to '${host}'; only virtual loopback addresses are available`);
}
function portNumber(value: unknown, zero: boolean): number {
  const port = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (typeof port !== 'number' || !Number.isInteger(port) || port < (zero ? 0 : 1) || port > 65535) {
    throw netError('ERR_SOCKET_BAD_PORT', `port must be an integer between ${zero ? 0 : 1} and 65535`);
  }
  return port;
}
function optionsFrom(args: any[], listen: boolean) {
  const values = [...args];
  const callback: Callback | undefined = typeof values[values.length - 1] === 'function' ? values.pop() : undefined;
  const first = values.shift();
  let options: Record<string, any>;
  if (first !== null && typeof first === 'object') {
    if (values.length) unsupported('Extra socket options');
    options = first;
    if (Object.keys(options).some(key => !['port', 'host', 'backlog'].includes(key))) unsupported('Socket listen/connect options other than port, host and backlog');
  } else {
    options = { port: first };
    if (typeof values[0] === 'string') options.host = values.shift();
    if (listen && typeof values[0] === 'number') options.backlog = values.shift();
    if (values.length) unsupported('Socket listen/connect arguments');
  }
  if (options.backlog !== undefined && (!listen || !Number.isInteger(options.backlog) || options.backlog < 0)) throw new TypeError('backlog must be a non-negative integer');
  return { port: portNumber(options.port ?? (listen ? 0 : undefined), listen), host: localHost(options.host, listen), callback };
}

/** One in-memory loopback network per Vtron System; it never opens an OS socket. */
export class VirtualNetwork {
  private ports = new Map<number, Binding>();
  private nextPort = 49152;
  bind(port: number, binding: Binding): number {
    if (!port) {
      for (let attempt = 0; attempt < 16384; attempt++) {
        const candidate = this.nextPort++;
        if (this.nextPort > 65535) this.nextPort = 49152;
        if (!this.ports.has(candidate)) { port = candidate; break; }
      }
      if (!port) throw netError('EADDRINUSE', 'No virtual ephemeral ports are available');
    }
    if (this.ports.has(port)) throw netError('EADDRINUSE', `Virtual port ${port} is already in use`, port);
    this.ports.set(port, binding);
    return port;
  }
  unbind(port: number, binding: Binding) { if (this.ports.get(port) === binding) this.ports.delete(port); }
  connect(port: number, client: VirtualSocket) {
    const binding = this.ports.get(port);
    if (!binding) throw netError('ECONNREFUSED', `No Vtron service is listening on virtual port ${port}`, port);
    binding.accept(client);
  }
}
const networks = new WeakMap<object, VirtualNetwork>();
export function getVirtualNetwork(owner: object): VirtualNetwork {
  let network = networks.get(owner);
  if (!network) { network = new VirtualNetwork(); networks.set(owner, network); }
  return network;
}

class Lifetime {
  private release?: () => void;
  private active = false;
  private referenced = true;
  constructor(private hooks: Hooks) {}
  start() { this.active = true; this.restart(); }
  stop() { this.active = false; this.release?.(); this.release = undefined; }
  ref() {
    this.referenced = true;
    if (this.active && !this.release) this.hooks.track(new Promise<void>(resolve => { this.release = resolve; }));
  }
  unref() { this.referenced = false; this.release?.(); this.release = undefined; }
  restart() { if (this.referenced) this.ref(); }
}

/** Minimal duplex byte stream used by both virtual TCP and the HTTP adapter. */
export class VirtualSocket extends ScriptEmitter {
  connecting = false;
  pending = true;
  destroyed = false;
  readable = true;
  writable = true;
  readableEnded = false;
  writableEnded = false;
  writableFinished = false;
  bytesRead = 0;
  bytesWritten = 0;
  remoteAddress?: string;
  remotePort?: number;
  localAddress?: string;
  localPort?: number;
  remoteFamily = 'IPv4';
  private peer?: VirtualSocket;
  private lifetime: Lifetime;
  private flowing = true;
  private received: Array<Buffer | null> = [];
  private outgoing: Array<() => void> = [];
  private encoding?: BufferEncoding;
  private decoder?: TextDecoder;
  private timeout?: ReturnType<typeof globalThis.setTimeout>;
  private timeoutDelay = 0;
  private connected = false;
  constructor(private network: VirtualNetwork, private hooks: Hooks, private done: (socket: VirtualSocket) => void, private allowHalfOpen = false) {
    super(hooks.reportError);
    this.lifetime = new Lifetime(hooks);
  }
  connect(...args: any[]) {
    if (this.destroyed || this.connecting || this.connected) throw netError('ERR_SOCKET_CONNECTING', 'Socket is already connected, connecting or destroyed');
    const { port, host, callback } = optionsFrom(args, false);
    if (callback) this.once('connect', callback);
    this.connecting = true;
    this.remoteAddress = host === '::1' ? '::1' : '127.0.0.1';
    this.remoteFamily = host === '::1' ? 'IPv6' : 'IPv4';
    this.remotePort = port;
    this.localAddress = this.remoteAddress;
    this.localPort = 0;
    this.lifetime.start();
    queueMicrotask(() => {
      if (this.destroyed) return;
      try { this.network.connect(port, this); }
      catch (error) { this.destroy(error); }
    });
    return this;
  }
  attach(peer: VirtualSocket, address: Address, accepted = false) {
    this.peer = peer;
    this.connected = true;
    this.connecting = false;
    this.pending = false;
    if (accepted) {
      this.localPort = address.port; this.localAddress = address.address;
      this.remoteAddress = address.family === 'IPv6' ? '::1' : '127.0.0.1'; this.remotePort = 0;
      this.lifetime.start();
    }
    this.touch();
  }
  ready() {
    if (this.destroyed) return;
    // Flush writes queued while connecting before connect listeners can append more.
    for (const send of this.outgoing.splice(0)) send();
    this.emit('connect');
    this.emit('ready');
  }
  private callback(callback: Callback | undefined, ...args: unknown[]) {
    try { callback?.(...args); } catch (error) { this.hooks.reportError(error); }
  }
  private touch() {
    if (this.timeout !== undefined) globalThis.clearTimeout(this.timeout);
    if (this.timeoutDelay && !this.destroyed) this.timeout = globalThis.setTimeout(() => { this.timeout = undefined; this.emit('timeout'); }, this.timeoutDelay);
  }
  private deliver(chunk: Buffer | null) {
    if (this.destroyed) return;
    this.received.push(chunk);
    this.flush();
  }
  private flush() {
    while (this.flowing && !this.destroyed && this.received.length) {
      const chunk = this.received.shift()!;
      if (chunk === null) {
        this.readableEnded = true; this.readable = false;
        if (this.decoder) { const tail = this.decoder.decode(); if (tail) this.emit('data', tail); }
        this.emit('end');
        if (!this.allowHalfOpen && !this.writableEnded) this.end();
        this.finishClose();
        break;
      }
      this.bytesRead += chunk.length; this.touch();
      this.emit('data', this.decoder ? this.decoder.decode(chunk, { stream: true }) : this.encoding ? chunk.toString(this.encoding) : chunk);
    }
  }
  write(chunk: string | Uint8Array, encoding?: BufferEncoding | Callback, callback?: Callback): boolean {
    const done = typeof encoding === 'function' ? encoding : callback;
    if (this.destroyed || this.writableEnded) { const error = netError('ERR_STREAM_WRITE_AFTER_END', 'write after socket end'); queueMicrotask(() => { this.callback(done, error); this.emit('error', error); }); return false; }
    if (typeof chunk !== 'string' && !(chunk instanceof Uint8Array)) throw new TypeError('Socket data must be a string or Uint8Array');
    const data = typeof chunk === 'string' ? Buffer.from(chunk, typeof encoding === 'string' ? encoding : 'utf8') : Buffer.from(chunk);
    this.bytesWritten += data.length; this.touch();
    const send = () => queueMicrotask(() => {
      if (this.destroyed || !this.peer || this.peer.destroyed) { const error = netError('EPIPE', 'Virtual socket peer is closed'); this.callback(done, error); if (!this.destroyed) this.emit('error', error); return; }
      this.peer.deliver(data); this.callback(done);
    });
    if (!this.connected) this.outgoing.push(send); else send();
    return true;
  }
  end(chunk?: string | Uint8Array | Callback, encoding?: BufferEncoding | Callback, callback?: Callback) {
    if (typeof chunk === 'function') { callback = chunk; chunk = undefined; }
    else if (typeof encoding === 'function') callback = encoding;
    if (this.writableEnded || this.destroyed) return this;
    if (chunk !== undefined) this.write(chunk, typeof encoding === 'string' ? encoding : undefined);
    if (callback) this.once('finish', callback);
    this.writableEnded = true; this.writable = false;
    const send = () => queueMicrotask(() => {
      if (this.destroyed) return;
      this.writableFinished = true;
      this.emit('finish'); this.peer?.deliver(null); this.finishClose();
    });
    if (!this.connected) this.outgoing.push(send); else send();
    return this;
  }
  private finishClose() { if (this.readableEnded && this.writableFinished) this.destroy(); }
  destroy(error?: unknown) {
    if (this.destroyed) return this;
    this.destroyed = true; this.connecting = false; this.pending = false; this.readable = false; this.writable = false;
    if (this.timeout !== undefined) globalThis.clearTimeout(this.timeout);
    this.lifetime.stop(); this.outgoing = []; this.received = [];
    const peer = this.peer;
    this.peer = undefined;
    this.done(this);
    queueMicrotask(() => {
      if (error) this.emit('error', error);
      this.emit('close', Boolean(error));
      if (peer && !peer.destroyed) peer.destroy(error ? netError('ECONNRESET', 'Virtual socket peer was reset') : undefined);
    });
    return this;
  }
  setEncoding(encoding: BufferEncoding) {
    if (!Buffer.isEncoding(encoding)) throw new TypeError('Unknown socket encoding');
    this.encoding = encoding;
    this.decoder = ['utf8', 'utf-8'].includes(encoding) ? new TextDecoder() : undefined;
    return this;
  }
  pause() { this.flowing = false; return this; }
  resume() { this.flowing = true; this.flush(); return this; }
  isPaused() { return !this.flowing; }
  pipe<T extends { write: (chunk: any) => unknown; end: () => unknown }>(destination: T, options?: { end?: boolean }): T {
    this.on('data', chunk => destination.write(chunk));
    if (options?.end !== false) this.once('end', () => destination.end());
    return destination;
  }
  setTimeout(delay: number, callback?: Callback) { if (!Number.isFinite(delay) || delay < 0) throw new TypeError('timeout must be non-negative'); this.timeoutDelay = delay; if (callback) this.once('timeout', callback); this.touch(); return this; }
  setNoDelay(_value?: boolean) { return this; }
  setKeepAlive(_value?: boolean, _delay?: number) { return this; }
  address() { return this.localPort === undefined ? {} : { address: this.localAddress, family: this.remoteFamily, port: this.localPort }; }
  ref() { this.lifetime.ref(); return this; }
  unref() { this.lifetime.unref(); return this; }
}

export function createScriptNet(network: VirtualNetwork, hooks: Hooks): { module: ScriptNetModule; dispose: () => void } {
  let disposed = false;
  const sockets = new Set<VirtualSocket>();
  const servers = new Set<Server>();
  class Socket extends VirtualSocket {
    constructor(options: { allowHalfOpen?: boolean } = {}) {
      if (disposed) throw netError('ABORT_ERR', 'Virtual network runtime is disposed');
      if (!options || typeof options !== 'object' || Object.keys(options).some(key => key !== 'allowHalfOpen')) unsupported('Socket options other than allowHalfOpen');
      super(network, hooks, socket => sockets.delete(socket), options.allowHalfOpen);
      sockets.add(this);
    }
  }
  class Server extends ScriptEmitter {
    listening = false;
    private binding?: Binding;
    private boundAddress?: Address;
    private lifetime = new Lifetime(hooks);
    private connections = new Set<VirtualSocket>();
    private closing = false;
    private allowHalfOpen = false;
    constructor(options?: { allowHalfOpen?: boolean } | Callback, listener?: Callback) {
      super(hooks.reportError);
      if (disposed) throw netError('ABORT_ERR', 'Virtual network runtime is disposed');
      if (typeof options === 'function') listener = options;
      else if (options !== undefined) {
        if (!options || typeof options !== 'object' || Object.keys(options).some(key => key !== 'allowHalfOpen')) unsupported('Server options other than allowHalfOpen');
        this.allowHalfOpen = options.allowHalfOpen ?? false;
      }
      if (listener) this.on('connection', listener);
      servers.add(this);
    }
    listen(...args: any[]) {
      if (disposed) throw netError('ABORT_ERR', 'Virtual network runtime is disposed');
      if (this.listening || this.closing) throw netError('ERR_SERVER_ALREADY_LISTEN', 'Virtual server is already listening or closing');
      const { port, host, callback } = optionsFrom(args, true);
      if (callback) this.once('listening', callback);
      const binding: Binding = { host, accept: client => {
        const socket = new Socket({ allowHalfOpen: this.allowHalfOpen });
        this.connections.add(socket);
        socket.once('close', () => { this.connections.delete(socket); this.finishClose(); });
        socket.attach(client, this.boundAddress!, true);
        client.attach(socket, this.boundAddress!);
        this.emit('connection', socket);
        client.ready();
      } };
      try {
        const assigned = network.bind(port, binding);
        this.binding = binding; this.boundAddress = { address: host, family: host.includes(':') ? 'IPv6' : 'IPv4', port: assigned };
        this.listening = true; this.lifetime.start();
        queueMicrotask(() => { if (this.listening) this.emit('listening'); });
      } catch (error) { queueMicrotask(() => this.emit('error', error)); }
      return this;
    }
    address() { return this.listening ? this.boundAddress! : null; }
    close(callback?: Callback) {
      if (!this.listening && !this.closing) {
        const error = netError('ERR_SERVER_NOT_RUNNING', 'Virtual server is not running');
        queueMicrotask(() => { if (callback) { try { callback(error); } catch (failure) { hooks.reportError(failure); } } else this.emit('error', error); });
        return this;
      }
      if (callback) this.once('close', callback);
      if (this.binding) network.unbind(this.boundAddress!.port, this.binding);
      this.listening = false; this.closing = true;
      this.finishClose();
      return this;
    }
    private finishClose() {
      if (!this.closing || this.connections.size) return;
      this.closing = false; this.binding = undefined; this.boundAddress = undefined;
      this.lifetime.stop();
      queueMicrotask(() => this.emit('close'));
    }
    getConnections(callback: (error: null, count: number) => void) { queueMicrotask(() => { try { callback(null, this.connections.size); } catch (error) { hooks.reportError(error); } }); }
    ref() { this.lifetime.ref(); return this; }
    unref() { this.lifetime.unref(); return this; }
  }
  const createServer = (options?: { allowHalfOpen?: boolean } | Callback, listener?: Callback) => new Server(options, listener);
  const connect = (...args: any[]) => new Socket().connect(...args);
  return {
    module: { Server, Socket, createServer, connect, createConnection: connect, isIP: (value: unknown) => typeof value === 'string' ? ipFamily(value) : 0, isIPv4: (value: unknown) => typeof value === 'string' && ipFamily(value) === 4, isIPv6: (value: unknown) => typeof value === 'string' && ipFamily(value) === 6 },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const server of servers) if (server.listening) server.close();
      for (const socket of sockets) socket.destroy();
      sockets.clear(); servers.clear();
    },
  };
}
