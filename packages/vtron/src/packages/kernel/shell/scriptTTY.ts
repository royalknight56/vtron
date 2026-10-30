type Stream = { fd: number; isTTY: boolean };
type Streams = { stdin: Stream; stdout: Stream; stderr: Stream };

function unsupported(name: string): never {
  throw Object.assign(new Error(`${name} cannot open an OS terminal in the Vtron browser runtime; use process.stdin, process.stdout or process.stderr`), { code: 'ERR_NOT_SUPPORTED' });
}

/** Only the descriptors attached to this script's existing terminal are TTYs. */
export function createScriptTTY(streams: Streams) {
  const descriptors = new Map([streams.stdin, streams.stdout, streams.stderr].map(stream => [stream.fd, stream]));
  class ReadStream {
    constructor(_fd: number, _options?: unknown) { unsupported('tty.ReadStream'); }
  }
  class WriteStream {
    constructor(_fd: number) { unsupported('tty.WriteStream'); }
  }
  return {
    isatty: (fd: unknown): boolean => typeof fd === 'number' && Number.isInteger(fd) && descriptors.get(fd)?.isTTY === true,
    ReadStream,
    WriteStream,
  };
}
