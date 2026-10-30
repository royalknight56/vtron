import { basename, relative, watch as watchStorage, type VtronFileInterface, type VtronWatchEvent } from 'vtron';
import { Buffer } from './scriptBuffer';
import { ScriptEmitter } from './scriptIO';
import type { ScriptWatchBackend, ScriptWatchSubscription } from './workerTransport';

type Options = { persistent?: boolean; recursive?: boolean; encoding?: string; signal?: AbortSignal };
export function createScriptWatch(configuration: { storage: VtronFileInterface; resolve: (path: string | URL) => string; backend?: ScriptWatchBackend; track: <T>(promise: Promise<T>) => Promise<T>; reportError: (error: unknown) => void }) {
  const watchers = new Set<{ close(): void }>();
  const backend: ScriptWatchBackend = configuration.backend ?? ((path, recursive, onEvent, onError) => {
    const controller = new AbortController(); let handle: { close(): void } | undefined;
    const ready = watchStorage(configuration.storage, path, onEvent, onError, { recursive, signal: controller.signal }).then(value => { handle = value; });
    return { ready, close() { controller.abort(); handle?.close(); } };
  });
  const watch = (file: string | URL, options?: Options | string | ((event: string, filename: string | Buffer) => void), listener?: (event: string, filename: string | Buffer) => void) => {
    if (typeof options === 'function') { listener = options; options = undefined; }
    const settings: Options = typeof options === 'string' ? { encoding: options } : options ?? {};
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new TypeError('watch options must be an object or encoding');
    for (const key of ['persistent', 'recursive'] as const) if (settings[key] !== undefined && typeof settings[key] !== 'boolean') throw new TypeError(`watch.${key} must be boolean`);
    if (settings.encoding && !['utf8', 'utf-8', 'buffer'].includes(settings.encoding)) throw Object.assign(new Error('watch supports UTF-8 filenames or buffer output only'), { code: 'ERR_NOT_SUPPORTED' });
    if (listener !== undefined && typeof listener !== 'function') throw new TypeError('watch listener must be a function');
    const signal = settings.signal;
    if (signal !== undefined && (!signal || typeof signal.aborted !== 'boolean' || typeof signal.addEventListener !== 'function' || typeof signal.removeEventListener !== 'function')) throw new TypeError('watch signal must be an AbortSignal');
    const root = configuration.resolve(file);
    let closed = false, referenced = settings.persistent ?? true, release: (() => void) | undefined;
    let subscription: ScriptWatchSubscription | undefined;
    const updateReference = () => {
      if (closed || !referenced) { release?.(); release = undefined; }
      else if (!release) configuration.track(new Promise<void>(resolve => { release = resolve; }));
    };
    const watcher = Object.assign(new ScriptEmitter(configuration.reportError), {
      ready: Promise.resolve(),
      ref() { referenced = true; updateReference(); return watcher; },
      unref() { referenced = false; updateReference(); return watcher; },
      close() {
        if (closed) return;
        closed = true; watchers.delete(watcher); signal?.removeEventListener('abort', abort);
        updateReference(); subscription?.close();
        queueMicrotask(() => watcher.emit('close'));
      },
    });
    const abort = () => watcher.close();
    if (listener) watcher.on('change', listener);
    watchers.add(watcher);
    if (signal?.aborted) { watcher.close(); return watcher; }
    signal?.addEventListener('abort', abort, { once: true });
    updateReference();
    const onEvent = (event: VtronWatchEvent) => {
      if (closed) return;
      const filename = relative(root, event.path) || basename(root);
      watcher.emit('change', event.type, settings.encoding === 'buffer' ? Buffer.from(filename) : filename);
    };
    const onError = (error: unknown) => { if (!closed) { watcher.emit('error', error); watcher.close(); } };
    try {
      subscription = backend(root, settings.recursive ?? false, onEvent, onError);
      void subscription.ready.catch(onError);
      watcher.ready = configuration.track(subscription.ready);
    } catch (error) {
      watcher.ready = configuration.track(Promise.reject(error));
      queueMicrotask(() => onError(error));
    }
    // Watch failures are delivered through the watcher error event even when
    // consumers do not use the additional readiness promise.
    void watcher.ready.catch(() => {});
    return watcher;
  };
  return { watch, dispose() { for (const watcher of [...watchers]) watcher.close(); } };
}
