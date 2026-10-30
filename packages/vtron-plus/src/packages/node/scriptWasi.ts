import { WASI as BrowserWASI } from '@tybys/wasm-util';

type Options = { version?: 'preview1'; args?: string[]; env?: Record<string, string>; preopens?: Record<string, string>; returnOnExit?: boolean; stdin?: number; stdout?: number; stderr?: number };

/** Standard WASI preview1 over the same Node fs facade. Unsupported FS calls
 * return ENOSYS through the upstream syscall error handling. */
export function createScriptWasi(fs: Record<string, unknown>, exit: (code: number) => void, stdout: (text: string) => unknown, stderr: (text: string) => unknown): { WASI: new (options: Options) => BrowserWASI } {
  const unsupported = () => { throw Object.assign(new Error('WASI filesystem operation is unsupported'), { code: 'ENOSYS' }); };
  const filesystem = new Proxy(fs, {
    get(target, key) {
      const value = Reflect.get(target, key);
      if (value === undefined) return unsupported;
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) => { try { return value(...args); } catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ERR_NOT_SUPPORTED') throw Object.assign(new Error(error.message), { code: 'ENOSYS' }); throw error; } };
    },
  });
  class WASI extends BrowserWASI {
    private memory?: WebAssembly.Memory;
    constructor(options: Options) {
      if (!options || options.version !== 'preview1') throw new TypeError('WASI requires version: preview1');
      for (const key of Object.keys(options)) if (!['version', 'args', 'env', 'preopens', 'returnOnExit', 'stdin', 'stdout', 'stderr'].includes(key)) throw Object.assign(new Error(`Unsupported WASI option: ${key}`), { code: 'ERR_NOT_SUPPORTED' });
      for (const fd of [options.stdin ?? 0, options.stdout ?? 1, options.stderr ?? 2]) if (!Number.isInteger(fd) || fd < 0) throw new TypeError('WASI stdio descriptors must be non-negative integers');
      if (options.stdin !== undefined && options.stdin !== 0) throw Object.assign(new Error('Redirected WASI stdin is unsupported'), { code: 'ERR_NOT_SUPPORTED' });
      super({ ...options, returnOnExit: true, fs: filesystem as never, print: stdout, printErr: stderr });
      // Node WASI consumers can initialize reactor/thread instances through
      // the existing kSetMemory hook. Capture that real binding as well as the
      // public start/initialize path; both must feed the same syscall memory.
      const memoryKey = Object.getOwnPropertySymbols(this).find(key => key.description === 'kSetMemory');
      if (memoryKey) {
        const bindings = this as unknown as Record<symbol, (memory: WebAssembly.Memory) => void>;
        const setMemory = bindings[memoryKey];
        bindings[memoryKey] = memory => { setMemory.call(this, memory); this.memory = memory; };
      }
      const procExit = this.wasiImport.proc_exit;
      const decoders = [new TextDecoder(), new TextDecoder()];
      this.wasiImport.proc_exit = (code: number) => {
        for (const [index, decoder] of decoders.entries()) { const text = decoder.decode(); if (text) (index === 0 ? stdout : stderr)(text); }
        if (options.returnOnExit === false) { exit(code); throw new Error('Virtual process exit returned unexpectedly'); }
        return procExit(code);
      };
      const read = this.wasiImport.fd_read;
      this.wasiImport.fd_read = (fd: number, ...args: number[]) => fd === 0 ? 6 : read(fd, ...args);
      this.wasiImport.random_get = (pointer: number, length: number) => {
        const memory = this.memory; if (!memory || !Number.isInteger(pointer) || !Number.isInteger(length) || pointer < 0 || length < 0 || pointer + length > memory.buffer.byteLength) return 21;
        if (!globalThis.crypto?.getRandomValues) return 52;
        const target = new Uint8Array(memory.buffer, pointer, length);
        for (let offset = 0; offset < length; offset += 65536) { const chunk = new Uint8Array(Math.min(65536, length - offset)); crypto.getRandomValues(chunk); target.set(chunk, offset); }
        return 0;
      };
      const write = this.wasiImport.fd_write;
      this.wasiImport.fd_write = (fd: number, iovs: number, length: number, result: number) => {
        if (fd !== 1 && fd !== 2) return write(fd, iovs, length, result);
        try {
          const memory = this.memory; if (!memory) return 21;
          const view = new DataView(memory.buffer), target = fd === 1 ? options.stdout ?? 1 : options.stderr ?? 2;
          let written = 0;
          if (!Number.isInteger(length) || length < 0 || iovs < 0 || iovs + length * 8 > memory.buffer.byteLength || result < 0 || result + 4 > memory.buffer.byteLength) return 21;
          for (let index = 0; index < length; index++) {
            const at = view.getUint32(iovs + index * 8, true), size = view.getUint32(iovs + index * 8 + 4, true);
            const chunk = new Uint8Array(memory.buffer, at, size);
            if (target === 1 || target === 2) (target === 1 ? stdout : stderr)(decoders[target - 1].decode(chunk, { stream: true }));
            else (fs.writeSync as Function)(target, chunk, 0, chunk.length, null);
            written += chunk.length;
          }
          view.setUint32(result, written, true); return 0;
        } catch (error) { if (error instanceof RangeError) return 21; if (error && typeof error === 'object' && 'code' in error) { if (error.code === 'EBADF') return 8; if (error.code === 'ENOSYS' || error.code === 'ERR_NOT_SUPPORTED') return 52; } return 29; }
      };
    }
    finalizeBindings(instance: WebAssembly.Instance, options?: { memory?: WebAssembly.Memory }) { this.memory = options?.memory ?? instance.exports.memory as WebAssembly.Memory; super.finalizeBindings(instance, options); }
  }
  return { WASI };
}
