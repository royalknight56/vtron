<template>
  <section class="code-terminal" aria-label="集成终端">
    <header class="code-terminal-header">
      <span class="code-terminal-tab">终端</span>
      <span class="code-terminal-cwd" :title="cwd">{{ cwd }}</span>
      <span v-if="busy" class="code-terminal-busy" role="status">正在运行</span>
      <button title="清空终端" aria-label="清空终端" @click="clear"><CodeIcon name="clear" /></button>
      <button title="隐藏终端" aria-label="隐藏终端" @click="$emit('hide')"><CodeIcon name="close" /></button>
    </header>
    <div class="code-terminal-output" role="log" aria-label="终端输出" aria-live="off" @click="focus">
      <div ref="host" class="code-terminal-screen"></div>
      <pre class="code-terminal-readable" aria-live="polite" aria-relevant="additions"><span v-for="(line, index) in screenLines" :key="index">{{ line }}{{ '\n' }}</span></pre>
    </div>
  </section>
</template>

<script setup lang="ts">
import { inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Terminal, type ITheme } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { System, dirname, normalize } from 'vtron';
import CodeIcon from './CodeIcon.vue';

type TerminalBridge = {
  columns: number;
  rows: number;
  onData: (listener: (data: string) => void) => () => void;
  onResize: (listener: (columns: number, rows: number) => void) => () => void;
};
const props = defineProps<{ initialCwd: string; visible: boolean; theme?: 'light' | 'dark' }>();
const emit = defineEmits<{ (event: 'hide'): void; (event: 'busy', value: boolean): void; (event: 'command-finished'): void }>();
const sys = inject<System>('system')!;
const shell = sys.createShell() as ReturnType<System['createShell']> & { setTerminal?: (terminal?: TerminalBridge) => void };
const cwd = ref(shell.router);
const host = ref<HTMLElement>();
const screenLines = ref<string[]>([]);
const busy = ref(false);
const inputListeners = new Set<(data: string) => void>();
const resizeListeners = new Set<(columns: number, rows: number) => void>();
const bridge: TerminalBridge = {
  columns: 80,
  rows: 24,
  onData(listener) { inputListeners.add(listener); return () => inputListeners.delete(listener); },
  onResize(listener) { resizeListeners.add(listener); return () => resizeListeners.delete(listener); },
};
const history: string[] = [];
let historyIndex = 0;
let historyDraft = '';
let input: string[] = [];
let cursor = 0;
let term: Terminal | undefined;
let fitAddon: FitAddon | undefined;
let observer: ResizeObserver | undefined;
let disposed = false;
let initialized = false;
let submitting = false;
let promptLine = 0;
let writing = Promise.resolve();
let readableFrame = 0;
let mountedResolve: () => void;
const mounted = new Promise<void>(resolve => { mountedResolve = resolve; });

// Serialize writes so cursor measurements include all preceding xterm output.
function write(value: string, error = false) {
  writing = writing.then(() => new Promise<void>(resolve => {
    if (!term || disposed) { resolve(); return; }
    term.write(error ? '\x1b[31m' + value + '\x1b[0m' : value, resolve);
  }));
  return writing;
}
shell.on('message', value => { void write(value); });

function updateReadableScreen() {
  if (readableFrame || disposed) return;
  readableFrame = requestAnimationFrame(() => {
    readableFrame = 0;
    if (!term || disposed) return;
    const buffer = term.buffer.active;
    const lines: string[] = [];
    for (let row = Math.max(0, buffer.length - 300); row < buffer.length; row++) {
      lines.push(buffer.getLine(row)?.translateToString(true) || '');
    }
    while (lines.length && !lines[lines.length - 1]) lines.pop();
    screenLines.value = lines;
  });
}

function palette(): ITheme {
  return props.theme === 'light'
    ? { background: '#ffffff', foreground: '#333333', cursor: '#333333', selectionBackground: '#add6ff', black: '#000000', red: '#cd3131', green: '#008000', yellow: '#795e26', blue: '#0451a5', magenta: '#af00db', cyan: '#007a7a', white: '#555555', brightBlack: '#666666', brightRed: '#cd3131', brightGreen: '#008000', brightYellow: '#795e26', brightBlue: '#0451a5', brightMagenta: '#af00db', brightCyan: '#007a7a', brightWhite: '#000000' }
    : { background: '#1e1e1e', foreground: '#cccccc', cursor: '#aeafad', selectionBackground: '#264f78' };
}

async function changeDirectory(path: string) {
  const target = normalize(path);
  const info = await sys.fs.stat(target);
  if (!info?.isDirectory) throw new Error(`文件夹不存在：${target}`);
  if ('setRouter' in shell && typeof shell.setRouter === 'function') shell.setRouter(target);
  else {
    await shell.exec('cd ' + JSON.stringify(target));
    if (normalize(shell.router) !== target) throw new Error(`无法切换终端目录：${target}`);
  }
  cwd.value = shell.router;
}
const ready = changeDirectory(props.initialCwd).catch(error => write(String(error) + '\r\n', true));

function absoluteCursorLine() { return term!.buffer.active.baseY + term!.buffer.active.cursorY; }

function redraw() {
  const text = shell.prefix + input.join('');
  const before = shell.prefix + input.slice(0, cursor).join('');
  writing = writing.then(() => new Promise<void>(resolve => {
    if (!term || disposed || busy.value) { resolve(); return; }
    const terminal = term;
    const distance = Math.max(0, absoluteCursorLine() - promptLine);
    terminal.write('\r' + (distance ? `\x1b[${distance}A` : '') + '\x1b[J' + text + ' ', () => {
      // Read actual cells rather than assuming UTF-16 length equals terminal width.
      let remaining = before.length;
      let line = promptLine;
      let column = 0;
      const buffer = terminal.buffer.active;
      while (remaining > 0 && line <= absoluteCursorLine()) {
        const cell = buffer.getLine(line)?.getCell(column);
        const width = cell?.getWidth() || 1;
        remaining -= cell?.getChars().length || 1;
        column += width;
        if (column >= terminal.cols) { line++; column = 0; }
      }
      const up = Math.max(0, absoluteCursorLine() - line);
      terminal.write('\r' + (up ? `\x1b[${up}A` : '') + (column ? `\x1b[${column}C` : ''), resolve);
    });
  }));
  return writing;
}

async function showPrompt() {
  await write('');
  if (!term || disposed) return;
  // A script may end without a newline, just like process.stdout.write().
  if (term.buffer.active.cursorX) await write('\r\n');
  promptLine = absoluteCursorLine();
  await redraw();
}

async function execute(command: string, directory?: string, submitted = false) {
  if (busy.value || disposed) return false;
  busy.value = true;
  emit('busy', true);
  try {
    await mounted;
    await ready;
    if (disposed) return false;
    if (!submitted) {
      await write('');
      const distance = Math.max(0, absoluteCursorLine() - promptLine);
      await write('\r' + (distance ? `\x1b[${distance}A` : '') + '\x1b[J');
    }
    if (directory) await changeDirectory(directory);
    if (!submitted) await write(shell.prefix + command + '\r\n');
    input = []; cursor = 0;
    if (history[history.length - 1] !== command) history.push(command);
    if (history.length > 100) history.shift();
    historyIndex = history.length;
    historyDraft = '';
    await shell.exec(command);
    return true;
  } catch (error) {
    await write((error instanceof Error ? error.message : String(error)) + '\r\n', true);
    return false;
  } finally {
    if (!disposed) {
      cwd.value = shell.router;
      busy.value = false;
      emit('busy', false);
      emit('command-finished');
      await showPrompt();
      focus();
    }
  }
}

async function submit() {
  if (!initialized || busy.value || submitting) return;
  submitting = true;
  try {
    cursor = input.length;
    await redraw();
    await write('\r\n');
    const command = input.join('').trim();
    input = []; cursor = 0;
    if (!command) { await showPrompt(); return; }
    if (command === 'clear') { clear(); return; }
    void execute(command, undefined, true);
  } finally { submitting = false; }
}

function setInput(value: string) { input = Array.from(value); cursor = input.length; void redraw(); }
function historyPrevious() {
  if (!history.length) return;
  if (historyIndex === history.length) historyDraft = input.join('');
  historyIndex = Math.max(0, historyIndex - 1);
  setInput(history[historyIndex]);
}
function historyNext() {
  historyIndex = Math.min(history.length, historyIndex + 1);
  setInput(historyIndex === history.length ? historyDraft : history[historyIndex]);
}

function handleData(data: string) {
  if (!initialized || disposed) return;
  if (busy.value) {
    if (inputListeners.size) [...inputListeners].forEach(listener => listener(data));
    else if (data === '\x03') (shell.emit as (event: string) => void)('interrupt');
    return;
  }
  if (submitting) return;
  const left = () => { cursor = Math.max(0, cursor - 1); };
  const right = () => { cursor = Math.min(input.length, cursor + 1); };
  switch (data) {
    case '\r': void submit(); return;
    case '\x1b[A': historyPrevious(); return;
    case '\x1b[B': historyNext(); return;
    case '\x1b[D': left(); break;
    case '\x1b[C': right(); break;
    case '\x01': case '\x1b[H': case '\x1b[1~': cursor = 0; break;
    case '\x05': case '\x1b[F': case '\x1b[4~': cursor = input.length; break;
    case '\x7f': case '\b': if (cursor) input.splice(--cursor, 1); break;
    case '\x1b[3~': input.splice(cursor, 1); break;
    case '\x15': input.splice(0, cursor); cursor = 0; break;
    case '\x0b': input.splice(cursor); break;
    case '\x0c': clear(); return;
    case '\x03':
      cursor = input.length;
      void redraw().then(() => write('^C\r\n')).then(() => { input = []; cursor = 0; return showPrompt(); });
      return;
    default: {
      const text = data.replace(/^\x1b\[200~/, '').replace(/\x1b\[201~$/, '').replace(/\r\n|[\r\n\t]/g, ' ');
      if (!text || /[\x00-\x1f\x7f]/.test(text)) return;
      const characters = Array.from(text);
      input.splice(cursor, 0, ...characters);
      cursor += characters.length;
    }
  }
  void redraw();
}

function clear() {
  writing = writing.then(() => new Promise<void>(resolve => {
    if (!term || disposed) { resolve(); return; }
    term.clear();
    updateReadableScreen();
    if (busy.value) { resolve(); return; }
    term.write('\x1b[2J\x1b[H', () => { promptLine = absoluteCursorLine(); resolve(); });
  }));
  if (!busy.value) void redraw();
  nextTick(focus);
}
function focus() { if (props.visible) term?.focus(); }
function runFile(path: string) { return execute('node ' + JSON.stringify(path), dirname(path)); }

function fit() {
  if (!term || !host.value || !props.visible || !host.value.clientWidth || !host.value.clientHeight) return;
  // FitAddon cannot measure a hidden terminal. Existing contents reflow on resize.
  fitAddon?.fit();
}
onMounted(async () => {
  // xterm 5's screenReaderMode skips insertText events; keep its native IME path active.
  term = new Terminal({ cursorBlink: true, fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 12, lineHeight: 1.2, scrollback: 5000, screenReaderMode: false, theme: palette(), convertEol: true });
  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.open(host.value!);
  term.textarea?.setAttribute('aria-label', '终端命令');
  term.attachCustomKeyEventHandler(event => {
    // Some WebViews omit legacy keyCode; map the interrupt using KeyboardEvent.key.
    if (event.type === 'keydown' && event.ctrlKey && !event.shiftKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault(); event.stopPropagation();
      if (term?.textarea) term.textarea.value = '';
      handleData('\x03');
      return false;
    }
    // Let the browser dispatch native clipboard shortcuts to xterm's copy/paste handlers.
    if ((event.metaKey || event.ctrlKey && event.shiftKey) && ['c', 'v'].includes(event.key.toLowerCase())) return false;
    return true;
  });
  term.onData(handleData);
  term.onWriteParsed(updateReadableScreen);
  term.onResize(({ cols, rows }) => {
    updateReadableScreen();
    bridge.columns = cols; bridge.rows = rows;
    [...resizeListeners].forEach(listener => listener(cols, rows));
    if (!busy.value && initialized) {
      promptLine = absoluteCursorLine();
      while (promptLine > 0 && term?.buffer.active.getLine(promptLine)?.isWrapped) promptLine--;
      void redraw();
    }
  });
  shell.setTerminal?.(bridge);
  observer = new ResizeObserver(fit);
  observer.observe(host.value!);
  fit();
  mountedResolve!();
  await ready;
  if (disposed) return;
  initialized = true;
  await showPrompt();
  focus();
});
watch(() => props.visible, visible => { if (visible) nextTick(() => { fit(); focus(); }); });
watch(() => props.theme, () => { if (term) term.options.theme = palette(); });
onBeforeUnmount(() => {
  disposed = true;
  cancelAnimationFrame(readableFrame);
  observer?.disconnect();
  shell.setTerminal?.();
  (shell.emit as (event: string) => void)('interrupt');
  shell.on('message', () => {});
  inputListeners.clear(); resizeListeners.clear();
  term?.dispose();
  mountedResolve!();
});
async function openAt(path: string) {
  await mounted; await ready;
  if (disposed || busy.value || submitting) return false;
  await changeDirectory(path);
  input = []; cursor = 0;
  await redraw(); focus();
  return true;
}
defineExpose({ focus, clear, runFile, openAt });
</script>

<style scoped>
.code-terminal { display: flex; flex-direction: column; flex-shrink: 0; min-height: 120px; max-height: 65%; overflow: hidden; border-top: 1px solid var(--border); color: var(--fg); background: var(--bg); font: 12px Menlo, Monaco, Consolas, monospace; }
.code-terminal-header { height: 34px; min-height: 34px; display: flex; align-items: center; gap: 8px; padding: 0 10px 0 18px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; }
.code-terminal-tab { align-self: stretch; display: flex; align-items: center; border-bottom: 1px solid #007acc; margin-right: 10px; }
.code-terminal-cwd { flex: 1; min-width: 0; color: var(--muted); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 11px; }
.code-terminal-busy { color: var(--muted); font-size: 11px; }
.code-terminal button { display: grid; place-items: center; border: 0; background: transparent; color: inherit; cursor: pointer; width: 24px; height: 24px; border-radius: 3px; }
.code-terminal button:hover { background: var(--hover); }.code-terminal button:focus-visible { outline: 1px solid #007fd4; }
.code-terminal button svg { width: 15px; height: 15px; }
.code-terminal-output { flex: 1; min-height: 0; padding: 6px 12px 5px 18px; overflow: hidden; }
.code-terminal-screen { height: 100%; }
.code-terminal-readable { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: pre; }
.code-terminal-output :deep(.xterm) { height: 100%; }
.code-terminal-output :deep(.xterm-viewport) { scrollbar-width: thin; }
.code-terminal-output :deep(.xterm-helper-textarea) { box-shadow: none; }
</style>
