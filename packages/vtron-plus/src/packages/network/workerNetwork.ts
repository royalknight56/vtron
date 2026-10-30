import { VirtualSocket, type VirtualNetwork, type VirtualNetworkBackend, type VirtualBinding, type VirtualAddress } from './virtualNet';

type Failure = { message: string; code?: string; port?: number; syscall?: string };
type Packet =
  | { type: 'request'; id: number; op: 'bind' | 'unbind' | 'connect'; key: string; port: number; host?: string }
  | { type: 'result'; id: number; value?: number; error?: Failure }
  | { type: 'accept'; key: string; binding: string; address: VirtualAddress }
  | { type: 'accepted'; key: string }
  | { type: 'data'; key: string; sequence: number; bytes: Uint8Array }
  | { type: 'ack'; key: string; sequence: number }
  | { type: 'end' | 'close'; key: string }
  | { type: 'reset'; key: string; error: Failure }
  | { type: 'dispose' | 'closed'; error?: Failure };
const MAX_SOCKET_BYTES = 32 * 1024 * 1024;
const MAX_BRIDGE_BYTES = 64 * 1024 * 1024;
const TIMEOUT = 10000;
function netError(code: string, message: string) { return Object.assign(new Error(message), { code }); }
function pack(error: unknown): Failure {
  const value = error as { message?: unknown; code?: unknown; port?: unknown; syscall?: unknown } | null;
  return { message: String(value?.message ?? error), code: typeof value?.code === 'string' ? value.code : 'ERR_VIRTUAL_NET', port: typeof value?.port === 'number' ? value.port : undefined, syscall: typeof value?.syscall === 'string' ? value.syscall : undefined };
}
function restore(error: Failure) { return Object.assign(netError(error.code || 'ERR_VIRTUAL_NET', error.message), { port: error.port, syscall: error.syscall }); }
const closedError = () => netError('ERR_VIRTUAL_NET_CLOSED', 'Worker virtual network bridge is closed');

/** A byte channel with bounded outstanding data. Acks confirm delivery to the
 * local socket queue, not remote application consumption or a completed HTTP response. */
function createWire(port: MessagePort, receive: (message: Packet) => void) {
  let closed = false, nextRequest = 0, sequence = 0, outstanding = 0;
  const endpoints = new Map<string, { socket: VirtualSocket; bytes: number; packets: Map<number, number> }>();
  const pending = new Map<number, { resolve: (value: number | undefined) => void; reject: (error: unknown) => void; timer: ReturnType<typeof setTimeout> }>();
  let rejectFailure!: (error: unknown) => void;
  const failure = new Promise<never>((_resolve, reject) => { rejectFailure = reject; });
  void failure.catch(() => {});
  const send = (message: Packet) => {
    if (closed) throw closedError();
    try { port.postMessage(message); } catch (error) { fail(error); throw error; }
  };
  const fail = (error: unknown) => { if (closed) return; rejectFailure(error); dispose(error); };
  const remove = (key: string) => {
    const endpoint = endpoints.get(key);
    if (endpoint) { outstanding -= endpoint.bytes; endpoints.delete(key); }
  };
  const add = (key: string, socket: VirtualSocket) => {
    if (closed) throw closedError();
    if (endpoints.has(key)) throw netError('ERR_VIRTUAL_NET_PROTOCOL', 'Duplicate socket ID');
    const endpoint = { socket, bytes: 0, packets: new Map<number, number>() };
    endpoints.set(key, endpoint);
    socket.on('data', (bytes: Uint8Array) => {
      if (closed) return;
      try {
        if (!(bytes instanceof Uint8Array)) throw netError('ERR_VIRTUAL_NET_PROTOCOL', 'Bridge sockets require byte data');
        if (endpoint.bytes + bytes.byteLength > MAX_SOCKET_BYTES || outstanding + bytes.byteLength > MAX_BRIDGE_BYTES) throw netError('ERR_VIRTUAL_NET_BUFFER_LIMIT', 'Worker virtual network outstanding data limit exceeded');
        const packet = ++sequence;
        endpoint.bytes += bytes.byteLength; outstanding += bytes.byteLength; endpoint.packets.set(packet, bytes.byteLength);
        send({ type: 'data', key, sequence: packet, bytes });
      } catch (error) { socket.destroy(error); }
    });
    socket.on('end', () => { if (!closed) send({ type: 'end', key }); });
    socket.on('error', (error: unknown) => { if (!closed) send({ type: 'reset', key, error: pack(error) }); });
    socket.once('close', () => { remove(key); if (!closed) send({ type: 'close', key }); });
  };
  const request = (op: 'bind' | 'unbind' | 'connect', key: string, portNumber: number, host?: string) => new Promise<number | undefined>((resolve, reject) => {
    if (closed) { reject(closedError()); return; }
    const id = ++nextRequest;
    const timer = setTimeout(() => fail(netError('ERR_VIRTUAL_NET_TIMEOUT', `Worker virtual network ${op} timed out`)), TIMEOUT);
    pending.set(id, { resolve, reject, timer });
    try { send({ type: 'request', id, op, key, port: portNumber, host }); }
    catch (error) { clearTimeout(timer); pending.delete(id); reject(error); }
  });
  const onMessage = (event: MessageEvent<Packet>) => {
    if (closed) return;
    const message = event.data;
    try {
      if (!message || typeof message !== 'object') throw netError('ERR_VIRTUAL_NET_PROTOCOL', 'Invalid network packet');
      if (message.type === 'closed') { fail(message.error ? restore(message.error) : closedError()); return; }
      if (message.type === 'result') {
        const waiter = pending.get(message.id);
        if (waiter) { pending.delete(message.id); clearTimeout(waiter.timer); if (message.error) waiter.reject(restore(message.error)); else waiter.resolve(message.value); }
        return;
      }
      if (message.type === 'data' || message.type === 'ack' || message.type === 'end' || message.type === 'reset' || message.type === 'close') {
        const endpoint = endpoints.get(message.key);
        if (!endpoint) return; // Late close/acks after a local reset are harmless.
        if (message.type === 'ack') {
          const size = endpoint.packets.get(message.sequence);
          if (size !== undefined) { endpoint.packets.delete(message.sequence); endpoint.bytes -= size; outstanding -= size; }
        } else if (message.type === 'data') {
          if (!(message.bytes instanceof Uint8Array) || message.bytes.byteLength > MAX_SOCKET_BYTES) throw netError('ERR_VIRTUAL_NET_PROTOCOL', 'Invalid socket bytes');
          endpoint.socket.write(message.bytes, (error?: unknown) => {
            if (closed) return;
            if (error) endpoint.socket.destroy(error);
            else send({ type: 'ack', key: message.key, sequence: message.sequence });
          });
        } else if (message.type === 'end') endpoint.socket.end();
        else endpoint.socket.destroy(message.type === 'reset' ? restore(message.error) : undefined);
        return;
      }
      receive(message);
    } catch (error) { fail(error); }
  };
  const messageError = () => fail(netError('ERR_VIRTUAL_NET_PROTOCOL', 'Could not decode Worker network message'));
  port.addEventListener('message', onMessage); port.addEventListener('messageerror', messageError); port.start();
  function dispose(error?: unknown) {
    if (closed) return;
    closed = true;
    try { port.postMessage({ type: error ? 'closed' : 'dispose', error: error ? pack(error) : undefined }); } catch { /* disconnected */ }
    for (const { timer, reject } of pending.values()) { clearTimeout(timer); reject(error || closedError()); }
    pending.clear();
    for (const { socket } of endpoints.values()) socket.destroy(error);
    endpoints.clear(); outstanding = 0;
    port.removeEventListener('message', onMessage); port.removeEventListener('messageerror', messageError); port.close();
  }
  return { send, request, add, failure, dispose, fail, endpoints, get closed() { return closed; } };
}
const relayHooks = { track: <T>(promise: Promise<T>) => promise, reportError: (_error: unknown) => {} };
function pair(client: VirtualSocket, relay: VirtualSocket, address: VirtualAddress) {
  relay.attach(client, address, true); client.attach(relay, address);
}

/** Host owns the real System registry, shared with Chrome's virtual HTTP preview. */
export function startWorkerNetworkHost(port: MessagePort, network: VirtualNetwork) {
  const bindings = new Map<string, { port: number; binding: VirtualBinding }>();
  const accepted = new Map<string, VirtualSocket>();
  let nextSocket = 0;
  const wire = createWire(port, message => {
    if (message.type === 'dispose') { dispose(); return; }
    if (message.type === 'accepted') { const client = accepted.get(message.key); accepted.delete(message.key); if (client && !client.destroyed) client.ready(); return; }
    if (message.type !== 'request') throw netError('ERR_VIRTUAL_NET_PROTOCOL', 'Unexpected host network packet');
    const reply = (value?: number, error?: unknown) => { if (!wire.closed) wire.send({ type: 'result', id: message.id, value, error: error === undefined ? undefined : pack(error) }); };
    void (async () => {
      if (!Number.isSafeInteger(message.id) || message.id < 1 || typeof message.key !== 'string' || !Number.isInteger(message.port) || message.port < 0 || message.port > 65535) throw netError('ERR_VIRTUAL_NET_PROTOCOL', 'Invalid network request');
      if (message.op === 'bind') {
        if (bindings.has(message.key)) throw netError('ERR_VIRTUAL_NET_PROTOCOL', 'Duplicate binding ID');
        const host = message.host;
        if (typeof host !== 'string' || !['localhost', 'localhost.', '127.0.0.1', '::1', '0.0.0.0', '::'].includes(host)) throw netError('ERR_NOT_SUPPORTED', 'Only virtual loopback binding is supported');
        const binding: VirtualBinding = { host, accept(client) {
          const key = 'host:' + ++nextSocket;
          const address: VirtualAddress = { address: host, family: host.includes(':') ? 'IPv6' : 'IPv4', port: bindings.get(message.key)!.port };
          const relay = new VirtualSocket(network, relayHooks, () => { accepted.delete(key); }, true);
          wire.add(key, relay); pair(client, relay, address);
          accepted.set(key, client);
          wire.send({ type: 'accept', key, binding: message.key, address });
        } };
        const assigned = network.bind(message.port, binding);
        bindings.set(message.key, { port: assigned, binding }); reply(assigned);
      } else if (message.op === 'unbind') {
        const entry = bindings.get(message.key);
        if (!entry || entry.port !== message.port) throw netError('ERR_VIRTUAL_NET_PROTOCOL', 'Unknown network binding');
        network.unbind(entry.port, entry.binding); bindings.delete(message.key); reply();
      } else if (message.op === 'connect') {
        const socket = new VirtualSocket(network, relayHooks, () => {}, true);
        wire.add(message.key, socket); socket.pause();
        await new Promise<void>((resolve, reject) => {
          socket.once('connect', resolve); socket.once('error', reject);
          socket.once('close', () => reject(netError('ECONNRESET', 'Connection closed before becoming ready')));
          socket.connect(message.port, message.host);
        });
        if (wire.closed) { socket.destroy(); return; }
        reply(); socket.resume();
      } else throw netError('ERR_VIRTUAL_NET_PROTOCOL', 'Unknown network operation');
    })().catch(error => reply(undefined, error));
  });
  function dispose() {
    for (const entry of bindings.values()) network.unbind(entry.port, entry.binding);
    bindings.clear(); accepted.clear(); wire.dispose();
  }
  // Fatal transport failures must also release owned port registrations.
  void wire.failure.catch(() => dispose());
  return { dispose, failure: wire.failure };
}

/** Worker backend uses the host registry; it never creates an isolated listener. */
export function createWorkerNetwork(port: MessagePort) {
  const bindings = new Map<string, VirtualBinding>();
  const ids = new Map<VirtualBinding, string>();
  let nextBinding = 0, nextSocket = 0;
  const wire = createWire(port, message => {
    if (message.type === 'dispose') { wire.fail(closedError()); return; }
    if (message.type !== 'accept') throw netError('ERR_VIRTUAL_NET_PROTOCOL', 'Unexpected Worker network packet');
    const binding = bindings.get(message.binding);
    if (!binding) { wire.send({ type: 'reset', key: message.key, error: pack(netError('ECONNREFUSED', 'Worker listener has closed')) }); return; }
    const carrier = new VirtualSocket(network, relayHooks, () => {}, true);
    wire.add(message.key, carrier);
    carrier.once('connect', () => wire.send({ type: 'accepted', key: message.key }));
    try { binding.accept(carrier); }
    catch (error) { carrier.destroy(error); }
  });
  const network: VirtualNetworkBackend = {
    async bind(port, binding) {
      const key = 'binding:' + ++nextBinding;
      bindings.set(key, binding); ids.set(binding, key);
      try {
        const assigned = await wire.request('bind', key, port, binding.host);
        if (typeof assigned !== 'number' || assigned < 1 || assigned > 65535) throw netError('ERR_VIRTUAL_NET_PROTOCOL', 'Invalid assigned port');
        return assigned;
      } catch (error) { bindings.delete(key); ids.delete(binding); throw error; }
    },
    async unbind(port, binding) {
      const key = ids.get(binding);
      if (!key) return;
      try { await wire.request('unbind', key, port); }
      finally { bindings.delete(key); ids.delete(binding); }
    },
    async connect(port, client) {
      const key = 'worker:' + ++nextSocket;
      const address: VirtualAddress = { address: client.remoteAddress || '127.0.0.1', family: client.remoteFamily === 'IPv6' ? 'IPv6' : 'IPv4', port };
      const relay = new VirtualSocket(network, relayHooks, () => {}, true);
      wire.add(key, relay);
      try {
        await wire.request('connect', key, port, address.address);
        if (client.destroyed) { relay.destroy(); return; }
        if (relay.destroyed) throw netError('ECONNRESET', 'Connection closed before becoming ready');
        pair(client, relay, address); client.ready();
      }
      catch (error) { client.destroy(error); }
    },
  };
  return { network, failure: wire.failure, dispose() { bindings.clear(); ids.clear(); wire.dispose(); } };
}
