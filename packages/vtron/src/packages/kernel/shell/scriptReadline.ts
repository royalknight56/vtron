type Listener = (...args: any[]) => void;
type InputStream = {
  on(event: string, listener: Listener): unknown;
  off?(event: string, listener: Listener): unknown;
  removeListener?(event: string, listener: Listener): unknown;
  emit(event: string, ...args: any[]): unknown;
  isTTY?: boolean;
  isRaw?: boolean;
  setRawMode?(enabled: boolean): unknown;
  pause?(): unknown;
  resume?(): unknown;
};
type OutputStream = { write(text: string): unknown; isTTY?: boolean; columns?: number; rows?: number };
type Key = { sequence?: string; name?: string; ctrl?: boolean; meta?: boolean; shift?: boolean };
type InterfaceOptions = {
  input?: InputStream;
  output?: OutputStream;
  terminal?: boolean;
  prompt?: string;
  history?: string[];
  historySize?: number;
  removeHistoryDuplicates?: boolean;
  completer?: (...args: any[]) => any;
};

class Emitter {
  private events = new Map<string, Listener[]>();
  on(event: string, listener: Listener) { this.events.set(event, [...(this.events.get(event) || []), listener]); return this; }
  addListener(event: string, listener: Listener) { return this.on(event, listener); }
  once(event: string, listener: Listener) {
    const wrapped: Listener & { listener?: Listener } = (...args) => { this.off(event, wrapped); listener(...args); };
    wrapped.listener = listener;
    return this.on(event, wrapped);
  }
  off(event: string, listener: Listener) {
    this.events.set(event, (this.events.get(event) || []).filter(item => item !== listener && (item as any).listener !== listener));
    return this;
  }
  removeListener(event: string, listener: Listener) { return this.off(event, listener); }
  removeAllListeners(event?: string) { if (event === undefined) this.events.clear(); else this.events.delete(event); return this; }
  listenerCount(event: string) { return this.events.get(event)?.length || 0; }
  listeners(event: string) { return [...(this.events.get(event) || [])]; }
  emit(event: string, ...args: any[]) {
    const listeners = this.listeners(event);
    if (event === 'error' && !listeners.length) throw args[0];
    listeners.forEach(listener => listener(...args));
    return listeners.length > 0;
  }
}

export interface ReadlineInterface extends Emitter {
  readonly input: InputStream;
  readonly output: OutputStream;
  readonly terminal: boolean;
  line: string;
  cursor: number;
  closed: boolean;
  history: string[];
  question(query: string, options?: { signal?: AbortSignal } | ((answer: string) => void), callback?: (answer: string) => void): Promise<string> | void;
  close(reason?: unknown): this;
  pause(): this;
  resume(): this;
  setPrompt(prompt: string): void;
  getPrompt(): string;
  prompt(preserveCursor?: boolean): void;
  getCursorPos(): { rows: number; cols: number };
  write(data?: string | null, key?: Key): void;
  [Symbol.asyncIterator](): AsyncIterableIterator<string>;
}

function error(code: string, message: string) { return Object.assign(new Error(message), { code }); }
function abortError(signal?: AbortSignal) {
  return Object.assign(new Error('The operation was aborted'), { name: 'AbortError', code: 'ABORT_ERR', cause: signal?.reason });
}
function detach(stream: InputStream, event: string, listener: Listener) {
  if (stream.off) stream.off(event, listener); else stream.removeListener?.(event, listener);
}

function keyOf(sequence: string): { character?: string; key: Key } {
  const key: Key = { sequence, name: undefined, ctrl: false, meta: false, shift: false };
  const ansi = /^\x1b(?:\[|O)(\d*)(?:;(\d+))?([~A-Za-z])$/.exec(sequence);
  if (ansi) {
    const names: Record<string, string> = { A: 'up', B: 'down', C: 'right', D: 'left', H: 'home', F: 'end', Z: 'tab', P: 'f1', Q: 'f2', R: 'f3', S: 'f4' };
    const numbers: Record<string, string> = { 1: 'home', 2: 'insert', 3: 'delete', 4: 'end', 5: 'pageup', 6: 'pagedown', 7: 'home', 8: 'end', 11: 'f1', 12: 'f2', 13: 'f3', 14: 'f4', 15: 'f5', 17: 'f6', 18: 'f7', 19: 'f8', 20: 'f9', 21: 'f10', 23: 'f11', 24: 'f12' };
    key.name = ansi[3] === '~' ? numbers[ansi[1]] : names[ansi[3]];
    const modifier = Number(ansi[2] || 1) - 1;
    key.shift = !!(modifier & 1) || ansi[3] === 'Z';
    key.meta = !!(modifier & 2);
    key.ctrl = !!(modifier & 4);
    return { key };
  }
  let character = sequence;
  if (sequence.startsWith('\x1b') && sequence.length > 1) { key.meta = true; character = sequence.slice(1); }
  const code = character.codePointAt(0)!;
  if (character === '\r') key.name = 'return';
  else if (character === '\n') key.name = 'enter';
  else if (character === '\t') key.name = 'tab';
  else if (character === '\b' || character === '\x7f') key.name = 'backspace';
  else if (character === '\x1b') { key.name = 'escape'; key.meta = true; }
  else if (character === ' ') key.name = 'space';
  else if (code >= 1 && code <= 26) { key.name = String.fromCharCode(96 + code); key.ctrl = true; }
  else if (code === 0) { key.name = 'space'; key.ctrl = true; }
  else if (/^[a-z0-9]$/i.test(character)) { key.name = character.toLowerCase(); key.shift = character !== character.toLowerCase(); }
  return { character, key };
}

function keyParser(emit: (character: string | undefined, key: Key) => void) {
  let buffer = '';
  let escapeTimer: ReturnType<typeof setTimeout> | undefined;
  const decoder = new TextDecoder();
  const parse = (flush = false) => {
    while (buffer) {
      let sequence: string;
      if (/^\x1b\[(?:200|201)~/.test(buffer)) { buffer = buffer.slice(6); continue; }
      if (buffer.startsWith('\x1b[') || buffer.startsWith('\x1bO')) {
        const match = /^\x1b(?:\[|O)[0-9;?]*[~A-Za-z]/.exec(buffer);
        if (!match && !flush) break;
        sequence = match?.[0] || buffer[0];
      } else if (buffer[0] === '\x1b') {
        if (buffer.length === 1 && !flush) break;
        sequence = buffer.length > 1 ? '\x1b' + [...buffer.slice(1)][0] : '\x1b';
      } else sequence = [...buffer][0];
      buffer = buffer.slice(sequence.length);
      const parsed = keyOf(sequence);
      emit(parsed.character, parsed.key);
    }
    if (buffer) escapeTimer = setTimeout(() => { escapeTimer = undefined; parse(true); }, 30);
  };
  return {
    feed(data: string | Uint8Array) {
      clearTimeout(escapeTimer);
      buffer += typeof data === 'string' ? data : decoder.decode(data, { stream: true });
      parse();
    },
    dispose() { clearTimeout(escapeTimer); buffer = ''; },
  };
}

function width(text: string) {
  let cells = 0;
  for (const char of text.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '')) {
    const point = char.codePointAt(0)!;
    if (/\p{Mark}/u.test(char)) continue;
    cells += point >= 0x1100 && (point <= 0x115f || point >= 0x2e80 && point <= 0xa4cf || point >= 0xac00 && point <= 0xd7a3 || point >= 0xf900 && point <= 0xfaff || point >= 0xfe10 && point <= 0xfe6f || point >= 0xff01 && point <= 0xff60 || point >= 0x1f300) ? 2 : 1;
  }
  return cells;
}

export function createReadlineModules(defaultInput: InputStream, defaultOutput: OutputStream) {
  const parsers = new Map<InputStream, ReturnType<typeof keyParser>>();
  const parserListeners = new Map<InputStream, Listener>();
  const interfaces = new Set<BrowserInterface>();
  const closeWaiters = new Set<() => void>();
  function emitKeypressEvents(stream: InputStream) {
    if (!stream || typeof stream.on !== 'function' || typeof stream.emit !== 'function') throw error('ERR_INVALID_ARG_TYPE', 'Expected an input stream');
    if (parsers.has(stream)) return;
    const parser = keyParser((character, key) => stream.emit('keypress', character, key));
    const listener: Listener = data => parser.feed(data);
    parsers.set(stream, parser);
    parserListeners.set(stream, listener);
    stream.on('data', listener);
  }

  class BrowserInterface extends Emitter {
    readonly input: InputStream;
    readonly output: OutputStream;
    readonly terminal: boolean;
    line = '';
    cursor = 0;
    closed = false;
    history: string[];
    private paused = false;
    private promptValue: string;
    private historyIndex = -1;
    private historyDraft = '';
    private previousRaw: boolean;
    private rendered = false;
    private renderedCursor = 0;
    private pending?: { query: string; resolve: (answer: string) => void; reject: (reason: unknown) => void; cleanup: () => void };
    private iteratorActive = false;
    private lines: string[] = [];
    private waiters: ((result: IteratorResult<string>) => void)[] = [];
    private skipLF = false;
    private textDecoder = new TextDecoder();
    private writeParser = keyParser((character, key) => this.handleKey(character, key));
    private readonly onKey: Listener = (character, key) => this.handleKey(character, key);
    private readonly onData: Listener = chunk => this.consume(typeof chunk === 'string' ? chunk : this.textDecoder.decode(chunk, { stream: true }));
    private readonly onEnd: Listener = () => { if (this.line) this.acceptLine(); this.close(); };
    private readonly onError: Listener = reason => { try { this.emit('error', reason); } finally { this.close(reason); } };

    constructor(private options: InterfaceOptions, private promiseBased: boolean) {
      super();
      this.input = options.input || defaultInput;
      this.output = options.output || defaultOutput;
      if (!this.input || typeof this.input.on !== 'function') throw error('ERR_INVALID_ARG_TYPE', 'Expected options.input to be a readable stream');
      this.terminal = options.terminal ?? !!this.output.isTTY;
      this.promptValue = options.prompt ?? '> ';
      this.history = [...(options.history || [])];
      this.previousRaw = !!this.input.isRaw;
      if (this.terminal) {
        emitKeypressEvents(this.input);
        this.input.on('keypress', this.onKey);
        this.input.setRawMode?.(true);
      } else this.input.on('data', this.onData);
      this.input.on('end', this.onEnd);
      this.input.on('error', this.onError);
      interfaces.add(this);
      this.input.resume?.();
    }

    private displayPrompt() { return this.pending?.query ?? this.promptValue; }
    private redraw() {
      if (!this.terminal || this.closed) return;
      const columns = Math.max(1, this.output.columns || 80);
      if (this.rendered) {
        const rows = Math.floor(this.renderedCursor / columns);
        this.output.write((rows ? `\x1b[${rows}A` : '') + '\r\x1b[J');
      }
      const prompt = this.displayPrompt();
      this.output.write(prompt + this.line);
      const end = width(prompt + this.line);
      const cursor = width(prompt + this.line.slice(0, this.cursor));
      const up = Math.floor(end / columns) - Math.floor(cursor / columns);
      if (up) this.output.write(`\x1b[${up}A`);
      if (cursor !== end) this.output.write(`\x1b[${cursor % columns + 1}G`);
      this.rendered = true;
      this.renderedCursor = cursor;
    }

    private consume(text: string) {
      if (this.closed || this.paused) return;
      for (const char of text) {
        if (char === '\n' && this.skipLF) { this.skipLF = false; continue; }
        this.skipLF = char === '\r';
        if (char === '\r' || char === '\n') this.acceptLine();
        else { this.line += char; this.cursor = this.line.length; }
      }
    }

    private acceptLine() {
      const answer = this.line;
      this.line = ''; this.cursor = 0; this.historyIndex = -1; this.rendered = false; this.renderedCursor = 0;
      if (this.terminal) this.output.write('\r\n');
      if (answer && this.terminal && (this.options.historySize ?? 30) > 0) {
        if (this.options.removeHistoryDuplicates) this.history = this.history.filter(item => item !== answer);
        if (this.history[0] !== answer) this.history.unshift(answer);
        this.history.length = Math.min(this.history.length, this.options.historySize ?? 30);
        this.emit('history', this.history);
      }
      if (this.pending) {
        const question = this.pending; this.pending = undefined; question.cleanup(); question.resolve(answer);
      } else {
        if (this.iteratorActive) {
          const waiter = this.waiters.shift();
          if (waiter) waiter({ value: answer, done: false }); else this.lines.push(answer);
        }
        this.emit('line', answer);
      }
    }

    private handleKey(character: string | undefined, key: Key = {}) {
      if (this.closed || this.paused) return;
      if (key.name === 'return' || key.name === 'enter') {
        if (key.name === 'enter' && this.skipLF) { this.skipLF = false; return; }
        this.skipLF = key.name === 'return'; this.acceptLine(); return;
      }
      this.skipLF = false;
      const before = this.line.slice(0, this.cursor);
      const after = this.line.slice(this.cursor);
      const previous = [...before].pop()?.length || 0;
      const next = [...after][0]?.length || 0;
      if (key.ctrl && key.name === 'c') {
        if (!this.emit('SIGINT')) { if (this.terminal) this.output.write('^C\r\n'); this.close(abortError()); }
        return;
      }
      if (key.ctrl && key.name === 'd' && !this.line) { this.close(); return; }
      if (key.name === 'left' || key.ctrl && key.name === 'b') this.cursor -= previous;
      else if (key.name === 'right' || key.ctrl && key.name === 'f') this.cursor += next;
      else if (key.name === 'home' || key.ctrl && key.name === 'a') this.cursor = 0;
      else if (key.name === 'end' || key.ctrl && key.name === 'e') this.cursor = this.line.length;
      else if (key.name === 'backspace') { this.line = before.slice(0, -previous || undefined) + after; this.cursor -= previous; }
      else if (key.name === 'delete' || key.ctrl && key.name === 'd') this.line = before + after.slice(next);
      else if (key.ctrl && key.name === 'u') { this.line = after; this.cursor = 0; }
      else if (key.ctrl && key.name === 'k') this.line = before;
      else if (key.ctrl && key.name === 'w') { const keep = before.replace(/\s*\S+\s*$/, ''); this.line = keep + after; this.cursor = keep.length; }
      else if (key.name === 'up' || key.name === 'down') {
        if (this.historyIndex < 0) this.historyDraft = this.line;
        this.historyIndex = Math.max(-1, Math.min(this.history.length - 1, this.historyIndex + (key.name === 'up' ? 1 : -1)));
        this.line = this.historyIndex < 0 ? this.historyDraft : this.history[this.historyIndex]; this.cursor = this.line.length;
      } else if (key.name === 'tab') { void this.complete(); return; }
      else if (key.ctrl && key.name === 'l') { this.output.write('\x1b[2J\x1b[H'); this.rendered = false; }
      else if (character && !key.ctrl && !key.meta && character >= ' ' && character !== '\x7f') { this.line = before + character + after; this.cursor += character.length; }
      else return;
      this.redraw();
    }

    private async complete() {
      const completer = this.options.completer;
      if (!completer) return;
      try {
        const result = completer.length >= 2 ? await new Promise<any>((resolve, reject) => completer(this.line, (failure: unknown, value: any) => failure ? reject(failure) : resolve(value))) : await completer(this.line);
        const [hits, completeOn] = result || [];
        if (!Array.isArray(hits) || !hits.length || typeof completeOn !== 'string') return;
        let common = String(hits[0]);
        for (const hit of hits.slice(1)) while (!String(hit).startsWith(common)) common = common.slice(0, -1);
        const before = this.line.slice(0, this.cursor);
        if (before.endsWith(completeOn)) {
          this.line = before.slice(0, before.length - completeOn.length) + common + this.line.slice(this.cursor);
          this.cursor += common.length - completeOn.length;
        }
        if (hits.length > 1 && common === completeOn) { this.output.write('\r\n' + hits.join('\t') + '\r\n'); this.rendered = false; }
        this.redraw();
      } catch (reason) { this.emit('error', reason); }
    }

    private async ask(query: string, options: { signal?: AbortSignal } = {}) {
      if (this.closed) throw error('ERR_USE_AFTER_CLOSE', 'readline was closed');
      if (typeof query !== 'string') throw error('ERR_INVALID_ARG_TYPE', 'Question must be a string');
      if (!options || typeof options !== 'object' || options.signal !== undefined && !(options.signal instanceof AbortSignal)) throw error('ERR_INVALID_ARG_TYPE', 'Expected a question options object with an AbortSignal');
      if (this.pending) throw error('ERR_INVALID_STATE', 'A question is already pending');
      const signal = options.signal;
      if (signal?.aborted) throw abortError(signal);
      return new Promise<string>((resolve, reject) => {
        const cancel = () => {
          if (!this.pending) return;
          this.pending = undefined; signal?.removeEventListener('abort', cancel); this.line = ''; this.cursor = 0;
          if (this.terminal && this.rendered) {
            const rows = Math.floor(this.renderedCursor / Math.max(1, this.output.columns || 80));
            this.output.write((rows ? `\x1b[${rows}A` : '') + '\r\x1b[J');
          }
          this.rendered = false; reject(abortError(signal));
        };
        this.pending = { query, resolve, reject, cleanup: () => signal?.removeEventListener('abort', cancel) };
        signal?.addEventListener('abort', cancel, { once: true });
        if (this.terminal) this.redraw(); else this.output.write(query);
        this.resume();
      });
    }

    question(query: string, options?: { signal?: AbortSignal } | ((answer: string) => void), callback?: (answer: string) => void): Promise<string> | void {
      if (this.promiseBased) return this.ask(query, typeof options === 'object' ? options : undefined);
      const answer = typeof options === 'function' ? options : callback;
      if (typeof answer !== 'function') throw error('ERR_INVALID_ARG_TYPE', 'Question callback must be a function');
      if (this.closed) throw error('ERR_USE_AFTER_CLOSE', 'readline was closed');
      void this.ask(query, typeof options === 'object' ? options : undefined).then(value => {
        // Report synchronously before a callback's close() can let runtime.settle finish.
        try { answer(value); } catch (reason) { this.input.emit('error', reason); }
      }, reason => {
        if (reason?.code !== 'ABORT_ERR' && reason?.code !== 'ERR_USE_AFTER_CLOSE') this.input.emit('error', reason);
      });
    }
    close(reason: unknown = error('ERR_USE_AFTER_CLOSE', 'readline was closed')) {
      if (this.closed) return this;
      this.closed = true;
      detach(this.input, 'keypress', this.onKey); detach(this.input, 'data', this.onData); detach(this.input, 'end', this.onEnd); detach(this.input, 'error', this.onError);
      if (this.terminal) this.input.setRawMode?.(this.previousRaw);
      this.writeParser.dispose();
      if (this.pending) { const question = this.pending; this.pending = undefined; question.cleanup(); question.reject(reason); }
      this.waiters.splice(0).forEach(resolve => resolve({ value: undefined, done: true }));
      interfaces.delete(this);
      if (!interfaces.size) { closeWaiters.forEach(resolve => resolve()); closeWaiters.clear(); }
      this.emit('close'); return this;
    }
    pause() { if (!this.closed && !this.paused) { this.paused = true; this.input.pause?.(); this.emit('pause'); } return this; }
    resume() { if (!this.closed) { const paused = this.paused; this.paused = false; this.input.resume?.(); if (paused) this.emit('resume'); } return this; }
    setPrompt(prompt: string) { this.promptValue = String(prompt); }
    getPrompt() { return this.promptValue; }
    prompt(preserveCursor = false) { this.resume(); if (!preserveCursor) this.cursor = this.line.length; if (this.terminal) this.redraw(); else if (!this.closed) this.output.write(this.promptValue); }
    getCursorPos() { const cells = width(this.displayPrompt() + this.line.slice(0, this.cursor)); const cols = this.output.columns || 80; return { rows: Math.floor(cells / cols), cols: cells % cols }; }
    write(data?: string | null, key?: Key) { this.resume(); if (key) this.handleKey(data || undefined, key); else if (data) this.terminal ? this.writeParser.feed(data) : this.consume(data); }
    [Symbol.asyncIterator](): AsyncIterableIterator<string> {
      this.iteratorActive = true;
      return {
        next: () => this.lines.length ? Promise.resolve({ value: this.lines.shift()!, done: false }) : this.closed ? Promise.resolve({ value: undefined, done: true }) : new Promise(resolve => this.waiters.push(resolve)),
        return: async () => { this.close(); return { value: undefined, done: true }; },
        [Symbol.asyncIterator]() { return this; },
      };
    }
  }

  function createInterface(promiseBased: boolean, options: InterfaceOptions | InputStream = {}, output?: OutputStream, completer?: InterfaceOptions['completer'], terminal?: boolean): ReadlineInterface {
    if (!options || typeof options !== 'object') throw error('ERR_INVALID_ARG_TYPE', 'Expected readline interface options');
    const config = 'on' in options ? { input: options, output, completer, terminal } : options;
    return new BrowserInterface(config, promiseBased);
  }
  const writeControl = (stream: OutputStream, text: string, callback?: () => void) => { const result = stream.write(text); callback?.(); return result; };
  const readline = {
    emitKeypressEvents,
    createInterface: (options?: InterfaceOptions | InputStream, output?: OutputStream, completer?: InterfaceOptions['completer'], terminal?: boolean) => createInterface(false, options, output, completer, terminal),
    cursorTo(stream: OutputStream, x: number, y?: number | (() => void), callback?: () => void) { return writeControl(stream, typeof y === 'number' ? `\x1b[${y + 1};${x + 1}H` : `\x1b[${x + 1}G`, typeof y === 'function' ? y : callback); },
    moveCursor(stream: OutputStream, dx: number, dy: number, callback?: () => void) { return writeControl(stream, (dy < 0 ? `\x1b[${-dy}A` : dy > 0 ? `\x1b[${dy}B` : '') + (dx < 0 ? `\x1b[${-dx}D` : dx > 0 ? `\x1b[${dx}C` : ''), callback); },
    clearLine(stream: OutputStream, direction: number, callback?: () => void) { return writeControl(stream, `\x1b[${direction < 0 ? 1 : direction > 0 ? 0 : 2}K`, callback); },
    clearScreenDown(stream: OutputStream, callback?: () => void) { return writeControl(stream, '\x1b[0J', callback); },
  };
  return {
    readline,
    promises: { createInterface: (options?: InterfaceOptions | InputStream, output?: OutputStream) => createInterface(true, options, output) },
    isActive: () => interfaces.size > 0,
    settle(): Promise<void> { return interfaces.size ? new Promise(resolve => closeWaiters.add(resolve)) : Promise.resolve(); },
    dispose() {
      [...interfaces].forEach(iface => iface.close());
      parsers.forEach((parser, stream) => { detach(stream, 'data', parserListeners.get(stream)!); parser.dispose(); });
      parsers.clear(); parserListeners.clear();
    },
  };
}
