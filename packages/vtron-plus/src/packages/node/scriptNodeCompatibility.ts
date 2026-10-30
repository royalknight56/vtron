type UnsupportedOperation = (...args: unknown[]) => never;
type UnsupportedConstructor = {
  new(...args: unknown[]): never;
  (...args: unknown[]): never;
  prototype: Record<string, unknown>;
};

function unsupported(operation: string): never {
  throw Object.assign(new Error(`${operation} is not supported by the Vtron browser runtime`), { code: 'ERR_NOT_SUPPORTED' });
}
function blocked(operation: string): UnsupportedOperation {
  return (..._args: unknown[]): never => unsupported(operation);
}
function blockedConstructor(operation: string): UnsupportedConstructor {
  return function (..._args: unknown[]): never { return unsupported(operation); } as UnsupportedConstructor;
}

/** Import compatibility only; these modules do not create Node services or streams. */
export function createScriptNodeCompatibility() {
  const v8 = {
    startupSnapshot: {
      // This execution is not building a Node startup snapshot.
      isBuildingSnapshot: () => false,
      addSerializeCallback: blocked('v8.startupSnapshot.addSerializeCallback'),
      addDeserializeCallback: blocked('v8.startupSnapshot.addDeserializeCallback'),
      setDeserializeMainFunction: blocked('v8.startupSnapshot.setDeserializeMainFunction'),
    },
    serialize: blocked('v8.serialize'),
    deserialize: blocked('v8.deserialize'),
    getHeapStatistics: blocked('v8.getHeapStatistics'),
    getHeapSnapshot: blocked('v8.getHeapSnapshot'),
  };

  const https = {
    createServer: blocked('https.createServer (TLS server)'),
    request: blocked('https.request (Node HTTP client; use fetch instead)'),
    get: blocked('https.get (Node HTTP client; use fetch instead)'),
    Agent: blockedConstructor('https.Agent'),
    Server: blockedConstructor('https.Server'),
  };
  const http2 = {
    createServer: blocked('http2.createServer'),
    createSecureServer: blocked('http2.createSecureServer'),
    connect: blocked('http2.connect'),
  };
  const tls = {
    connect: blocked('tls.connect'),
    createServer: blocked('tls.createServer'),
    createSecureContext: blocked('tls.createSecureContext'),
    TLSSocket: blockedConstructor('tls.TLSSocket'),
  };

  const Stream = blockedConstructor('stream.Stream');
  const Readable = Object.assign(blockedConstructor('stream.Readable'), { from: blocked('stream.Readable.from') });
  const Writable = blockedConstructor('stream.Writable');
  const Duplex = blockedConstructor('stream.Duplex');
  const Transform = blockedConstructor('stream.Transform');
  const PassThrough = blockedConstructor('stream.PassThrough');
  // follow-redirects reads this method during initialization. Calling it must fail.
  for (const constructor of [Stream, Readable, Writable, Duplex, Transform, PassThrough]) {
    constructor.prototype.destroy = blocked('stream.destroy');
  }
  const streamPromises = {
    async pipeline(..._args: unknown[]): Promise<never> { return unsupported('stream/promises.pipeline'); },
    async finished(..._args: unknown[]): Promise<never> { return unsupported('stream/promises.finished'); },
  };
  const stream = Object.assign(Stream, {
    Stream, Readable, Writable, Duplex, Transform, PassThrough,
    pipeline: blocked('stream.pipeline'),
    finished: blocked('stream.finished'),
    promises: streamPromises,
  });

  const zlib = {
    // Protocol constants used by Vite's bundled ws and compression middleware.
    Z_DEFAULT_WINDOWBITS: 15,
    Z_SYNC_FLUSH: 2,
    constants: { Z_DEFAULT_WINDOWBITS: 15, Z_SYNC_FLUSH: 2, BROTLI_PARAM_QUALITY: 1, BROTLI_PARAM_SIZE_HINT: 5 },
    createInflateRaw: blocked('zlib.createInflateRaw'),
    createDeflateRaw: blocked('zlib.createDeflateRaw'),
    createGzip: blocked('zlib.createGzip'),
    createBrotliCompress: blocked('zlib.createBrotliCompress'),
  };

  const Session = blockedConstructor('inspector.Session');
  for (const method of ['connect', 'connectToMainThread', 'post', 'disconnect']) Session.prototype[method] = blocked(`inspector.Session.${method}`);
  const inspector = {
    // No Node Inspector endpoint exists for a script executed in the page.
    url: (): undefined => undefined,
    Session,
    open: blocked('inspector.open'),
    close: blocked('inspector.close'),
    waitForDebugger: blocked('inspector.waitForDebugger'),
  };
  const vm = {
    Script: blockedConstructor('vm.Script'),
    createContext: blocked('vm.createContext'),
    runInContext: blocked('vm.runInContext'),
    runInNewContext: blocked('vm.runInNewContext'),
    runInThisContext: blocked('vm.runInThisContext'),
    compileFunction: blocked('vm.compileFunction'),
  };
  return { v8, https, http2, tls, stream, 'stream/promises': streamPromises, zlib, inspector, vm };
}
