import type { ShellTerminal } from 'vtron';

type Listener = (...args: any[]) => void;
type EventName = string | symbol;
type StoredListener = Listener & { listener?: Listener };

export class ScriptEmitter {
  private events = new Map<EventName, StoredListener[]>();
  constructor(private reportError: (error: unknown) => void, private onChange?: () => void) {}
  private add(event: EventName, listener: StoredListener, prepend: boolean) {
    if (typeof listener !== 'function') throw Object.assign(new TypeError('listener must be a function'), { code: 'ERR_INVALID_ARG_TYPE' });
    const listeners = this.events.get(event) || [];
    if (prepend) listeners.unshift(listener); else listeners.push(listener);
    this.events.set(event, listeners);
    this.onChange?.();
    return this;
  }
  on(event: EventName, listener: Listener) { return this.add(event, listener, false); }
  addListener(event: EventName, listener: Listener) { return this.on(event, listener); }
  prependListener(event: EventName, listener: Listener) { return this.add(event, listener, true); }
  private addOnce(event: EventName, listener: Listener, prepend: boolean) {
    if (typeof listener !== 'function') throw Object.assign(new TypeError('listener must be a function'), { code: 'ERR_INVALID_ARG_TYPE' });
    let fired = false;
    const once = Object.assign((...args: any[]) => {
      if (fired) return;
      fired = true; this.off(event, once); listener.apply(this, args);
    }, { listener });
    return this.add(event, once, prepend);
  }
  once(event: EventName, listener: Listener) { return this.addOnce(event, listener, false); }
  prependOnceListener(event: EventName, listener: Listener) { return this.addOnce(event, listener, true); }
  off(event: EventName, listener: Listener) {
    if (typeof listener !== 'function') throw Object.assign(new TypeError('listener must be a function'), { code: 'ERR_INVALID_ARG_TYPE' });
    const listeners = this.events.get(event);
    if (listeners) for (let index = listeners.length - 1; index >= 0; index--) {
      if (listeners[index] !== listener && listeners[index].listener !== listener) continue;
      listeners.splice(index, 1);
      if (!listeners.length) this.events.delete(event);
      break;
    }
    this.onChange?.();
    return this;
  }
  removeListener(event: EventName, listener: Listener) { return this.off(event, listener); }
  removeAllListeners(event?: EventName) { if (arguments.length) this.events.delete(event!); else this.events.clear(); this.onChange?.(); return this; }
  listenerCount(event: EventName, listener?: Listener) {
    const listeners = this.events.get(event) || [];
    return listener ? listeners.filter(item => item === listener || item.listener === listener).length : listeners.length;
  }
  listeners(event: EventName) { return (this.events.get(event) || []).map(item => item.listener || item); }
  rawListeners(event: EventName) { return [...(this.events.get(event) || [])]; }
  eventNames() { return [...this.events.keys()]; }
  emit(event: EventName, ...args: any[]) {
    const listeners = this.rawListeners(event);
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
