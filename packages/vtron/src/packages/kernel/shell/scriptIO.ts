import type { ShellTerminal } from './ShellType';

type Listener = (...args: any[]) => void;

export class ScriptEmitter {
  private events = new Map<string, Listener[]>();
  constructor(private reportError: (error: unknown) => void, private onChange?: () => void) {}
  on(event: string, listener: Listener) {
    const listeners = this.events.get(event) || [];
    listeners.push(listener);
    this.events.set(event, listeners);
    this.onChange?.();
    return this;
  }
  addListener(event: string, listener: Listener) { return this.on(event, listener); }
  once(event: string, listener: Listener) {
    const once = Object.assign((...args: any[]) => { this.off(event, once); listener.apply(this, args); }, { listener });
    return this.on(event, once);
  }
  off(event: string, listener: Listener) {
    const listeners = this.events.get(event);
    if (listeners) this.events.set(event, listeners.filter(item => item !== listener && (item as Listener & { listener?: Listener }).listener !== listener));
    this.onChange?.();
    return this;
  }
  removeListener(event: string, listener: Listener) { return this.off(event, listener); }
  removeAllListeners(event?: string) { if (event) this.events.delete(event); else this.events.clear(); this.onChange?.(); return this; }
  listenerCount(event: string) { return this.events.get(event)?.length || 0; }
  listeners(event: string) { return [...(this.events.get(event) || [])]; }
  emit(event: string, ...args: any[]) {
    const listeners = this.listeners(event);
    if (!listeners.length && event === 'error') this.reportError(args[0]);
    for (const listener of listeners) {
      try { listener.apply(this, args); } catch (error) { this.reportError(error); }
    }
    return listeners.length > 0;
  }
}

export function scriptAbortError() {
  return Object.assign(new Error('Script interrupted'), { name: 'AbortError', code: 'ABORT_ERR' });
}

export function createScriptIO(write: (chunk: string | Uint8Array) => boolean, reportError: (error: unknown) => void, terminal?: ShellTerminal, interrupt?: (echo: boolean) => void) {
  const waiters = new Set<() => void>();
  const isActive = (): boolean => stdin.isTTY && stdin.readable && !stdin.destroyed && stdin.readableFlowing && stdin.isRaw && !!(stdin.listenerCount('data') || stdin.listenerCount('keypress'));
  const changed = () => {
    if (isActive()) return;
    for (const resolve of waiters) resolve();
    waiters.clear();
  };
  const stdin = Object.assign(new ScriptEmitter(reportError, changed), {
    fd: 0, isTTY: !!terminal, isRaw: false, readable: true, readableEnded: false, destroyed: false, readableFlowing: true,
    setRawMode(mode: boolean) { stdin.isRaw = Boolean(mode); changed(); return stdin; },
    setEncoding(encoding: string) {
      if (!['utf8', 'utf-8'].includes(encoding)) throw new TypeError('stdin supports UTF-8 only');
      return stdin;
    },
    resume() { stdin.readableFlowing = true; stdin.emit('resume'); changed(); return stdin; },
    pause() { stdin.readableFlowing = false; stdin.emit('pause'); changed(); return stdin; },
    ref() { return stdin; }, unref() { return stdin; },
  });
  const makeOutput = (fd: number) => Object.assign(new ScriptEmitter(reportError), {
    fd, isTTY: !!terminal, writable: true, columns: terminal?.columns || 80, rows: terminal?.rows || 24,
    write(chunk: string | Uint8Array, encoding?: string | (() => void), callback?: () => void) {
      const result = write(chunk);
      (typeof encoding === 'function' ? encoding : callback)?.();
      return result;
    },
    cursorTo(x: number, y?: number) { return write(y === undefined ? `\x1b[${x + 1}G` : `\x1b[${y + 1};${x + 1}H`); },
    moveCursor(dx: number, dy: number) { return write((dx ? `\x1b[${Math.abs(dx)}${dx > 0 ? 'C' : 'D'}` : '') + (dy ? `\x1b[${Math.abs(dy)}${dy > 0 ? 'B' : 'A'}` : '')); },
    clearLine(direction: number) { return write(`\x1b[${direction < 0 ? 1 : direction > 0 ? 0 : 2}K`); },
    clearScreenDown() { return write('\x1b[0J'); },
    getWindowSize() { return [terminal?.columns || 80, terminal?.rows || 24]; },
    getColorDepth() { return 24; }, hasColors() { return !!terminal; },
  });
  const stdout = makeOutput(1);
  const stderr = makeOutput(2);
  const removeInput = terminal?.onData(data => {
    if (stdin.destroyed) return;
    const wasRaw = stdin.isRaw;
    if (stdin.readableFlowing) stdin.emit('data', data);
    if (data === '\x03' && !stdin.isRaw && !stdin.listenerCount('keypress')) interrupt?.(!wasRaw);
  });
  const removeResize = terminal?.onResize?.((columns, rows) => {
    for (const stream of [stdout, stderr]) {
      stream.columns = columns; stream.rows = rows; stream.emit('resize');
    }
  });
  const dispose = () => {
    removeInput?.(); removeResize?.();
    stdin.readable = false; stdin.readableEnded = true; stdin.destroyed = true; stdin.isRaw = false;
    changed();
    stdin.emit('end'); stdin.emit('close');
    for (const stream of [stdin, stdout, stderr]) stream.removeAllListeners();
  };
  const settle = (): Promise<void> => isActive() ? new Promise(resolve => waiters.add(resolve)) : Promise.resolve();
  return { stdin, stdout, stderr, isActive, settle, dispose };
}
