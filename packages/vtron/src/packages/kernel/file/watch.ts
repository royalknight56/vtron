import { resolve, join } from '../../util/Path';
import type { VtronFileInterface } from './FIleInterface';
import { realpath } from './operations';
import { readFileBytes } from './binary';

export type VtronWatchEvent = { type: 'rename' | 'change'; path: string };
export interface VtronWatchOptions { recursive?: boolean; intervalMs?: number; signal?: AbortSignal }
export interface VtronWatchHandle { close(): void }
type Storage = Pick<VtronFileInterface, 'stat' | 'readdir' | 'readFile' | 'readBinaryFile'>;
type Entry = { kind: string; metadata: string; content?: Uint8Array };
const MAX_ENTRIES = 4096, MAX_CONTENT_BYTES = 16 * 1024 * 1024;

/** Poll actual Vtron storage, including mounted backends. This observes stable
 * states between polls; it is not a native OS watch or an atomic tree snapshot. */
export async function watch(storage: Storage, path: string, onEvent: (event: VtronWatchEvent) => void, onError: (error: unknown) => void, options: VtronWatchOptions = {}): Promise<VtronWatchHandle> {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\0') || resolve(path) !== path) throw Object.assign(new TypeError('Expected a normalized absolute watch path'), { code: 'ERR_INVALID_ARG_VALUE' });
  if (typeof onEvent !== 'function' || typeof onError !== 'function') throw new TypeError('Watch callbacks must be functions');
  const interval = options.intervalMs ?? 250;
  if (!Number.isFinite(interval) || interval < 10 || interval > 2147483647) throw new RangeError('Watch interval must be between 10 and 2147483647 ms');
  let stopped = false, timer: ReturnType<typeof setTimeout> | undefined;
  const close = () => { if (stopped) return; stopped = true; clearTimeout(timer); options.signal?.removeEventListener('abort', close); };
  const check = () => { if (stopped || options.signal?.aborted) throw Object.assign(new Error('File watch aborted'), { name: 'AbortError', code: 'ABORT_ERR' }); };
  options.signal?.addEventListener('abort', close, { once: true });
  const snapshot = async (root: string) => {
    let bytes = 0;
    const entries = new Map<string, Entry>();
    const visit = async (target: string, descend: boolean) => {
      check(); const info = await storage.stat(target); check();
      if (!info) return;
      if (target === root && info.isSymlink) throw Object.assign(new Error('Watching a symbolic-link target is unsupported'), { code: 'ERR_NOT_SUPPORTED', path: target });
      const kind = info.isSymlink ? 'link' : info.isDirectory ? 'directory' : info.isFile ? 'file' : 'unknown';
      if (kind === 'unknown') throw Object.assign(new Error('Unknown file kind while watching'), { code: 'ERR_NOT_SUPPORTED', path: target });
      const entry: Entry = { kind, metadata: JSON.stringify([info.size, new Date(info.mtime).getTime(), info.mode]) };
      if (kind === 'file') {
        const content = await readFileBytes(storage, target); check();
        if (content === null) return; // Removed between stat and read; next state is absent.
        bytes += content.byteLength;
        if (bytes > MAX_CONTENT_BYTES) throw Object.assign(new Error('Watch snapshot content exceeds 16 MiB'), { code: 'ERR_FS_WATCH_LIMIT' });
        entry.content = content;
      }
      if (entries.size >= MAX_ENTRIES) throw Object.assign(new Error('Watch snapshot exceeds 4096 entries'), { code: 'ERR_FS_WATCH_LIMIT' });
      entries.set(target, entry);
      if (kind === 'directory' && descend) {
        const children = await storage.readdir(target); check();
        for (const child of children) {
          if (!child.name || child.name === '.' || child.name === '..' || child.name.includes('/')) throw Object.assign(new Error('Invalid directory entry while watching'), { code: 'ERR_FS_WATCH_PROTOCOL' });
          await visit(join(target, child.name), options.recursive ?? false);
        }
      }
    };
    await visit(root, true);
    return entries;
  };
  try {
    check();
    const root = await realpath(storage, path); check();
    let previous = await snapshot(root);
    if (!previous.has(root)) throw Object.assign(new Error(`ENOENT: watch '${root}'`), { code: 'ENOENT', path: root });
    const poll = async () => {
      try {
        const current = await snapshot(root); check();
        for (const key of new Set([...previous.keys(), ...current.keys()])) {
          const before = previous.get(key), after = current.get(key);
          if (!before || !after || before.kind !== after.kind) onEvent({ type: 'rename', path: key });
          else if (before.metadata !== after.metadata || before.content?.length !== after.content?.length || (before.content !== undefined && after.content !== undefined && before.content.some((byte, index) => byte !== after.content![index]))) onEvent({ type: 'change', path: key });
          if (stopped) return;
        }
        previous = current;
        if (!stopped) timer = setTimeout(() => { void poll(); }, interval);
      } catch (error) { if (!stopped) { try { onError(error); } finally { close(); } } }
    };
    timer = setTimeout(() => { void poll(); }, interval);
    return { close };
  } catch (error) { close(); throw error; }
}
