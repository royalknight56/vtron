<template>
  <Win10Frame title="命令提示符" :icon="win?.windowInfo.icon" background="#0c0c0c" color="#ccc">
    <div ref="viewport" class="command-console" @click="focusInput">
      <pre class="transcript" role="log" aria-label="命令输出">{{ transcript }}</pre>
      <form class="command-line" @submit.prevent="submit">
        <span>{{ displayPath(cwd) }}&gt;</span>
        <input
          ref="input"
          v-model="command"
          aria-label="命令输入"
          autocomplete="off"
          autocapitalize="off"
          :spellcheck="false"
          :disabled="busy"
          @keydown="onKeydown"
        />
      </form>
    </div>
  </Win10Frame>
</template>

<script setup lang="ts">
import { inject, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { basename, BrowserWindow, join, normalize, System } from 'vtron';
import Win10Frame from '../daily/Win10Frame.vue';

const system = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');
const canonical = (path: string) => normalize(path).replace(/\/$/, '') || '/';
const cwd = ref(canonical(system.getConfig('userLocation') || '/C/Users'));
const command = ref('');
const transcript = ref('Vtron 命令提示符\n\n');
const busy = ref(false);
const input = ref<HTMLInputElement>();
const viewport = ref<HTMLElement>();
const history: string[] = [];
let historyIndex = 0;
let draft = '';
let disposed = false;

const help: Record<string, string> = {
  CD: '显示或更改当前虚拟目录。用法：CD [路径]，CD .. 返回上级目录。',
  CHDIR: '与 CD 相同。',
  CLS: '清除屏幕。',
  DATE: '显示当前日期。',
  DIR: '显示虚拟目录中的文件。用法：DIR [路径] [/B]，/B 仅显示名称。',
  ECHO: '显示消息。用法：ECHO [消息]。',
  EXIT: '关闭命令提示符。',
  HELP: '显示命令帮助。用法：HELP [命令]。',
  TIME: '显示当前时间。',
  TYPE: '显示虚拟文本文件。用法：TYPE 文件名。',
  VER: '显示当前命令环境。',
};

function displayPath(path: string) {
  const match = path.match(/^\/([a-z])(?:\/(.*))?$/i);
  return match
    ? `${match[1].toUpperCase()}:\\${(match[2] || '').replace(/\/$/, '').replace(/\//g, '\\')}`
    : '\\';
}
function resolvePath(value: string) {
  const path = value.replace(/\\/g, '/');
  if (/^[a-z]:(?:\/|$)/i.test(path)) return canonical('/' + path[0].toUpperCase() + '/' + path.slice(2));
  if (path.startsWith('/')) {
    const drive = cwd.value.split('/')[1] || 'C';
    return canonical('/' + drive + path);
  }
  return canonical(join(cwd.value, path));
}
function write(value = '') {
  if (disposed) return;
  transcript.value = (transcript.value + value + '\n').slice(-160000);
}
async function focusInput() {
  if (!window.getSelection()?.toString()) input.value?.focus();
}
async function scrollToInput() {
  await nextTick();
  if (disposed) return;
  if (viewport.value) viewport.value.scrollTop = viewport.value.scrollHeight;
  input.value?.focus();
}
function tokens(value: string) {
  const result: string[] = [];
  let word = '';
  let quoted = false;
  let started = false;
  for (const char of value) {
    if (char === '"') {
      quoted = !quoted;
      started = true;
    } else if (/\s/.test(char) && !quoted) {
      if (started) result.push(word);
      word = '';
      started = false;
    } else {
      word += char;
      started = true;
    }
  }
  if (quoted) throw new Error('引号不匹配。');
  if (started) result.push(word);
  return result;
}
function stamp(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return '                   ';
  return `${date.toLocaleDateString('zh-CN')}  ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}
async function execute(line: string) {
  const args = tokens(line);
  const name = (args.shift() || '').toUpperCase();
  if (!name) return;
  if (args.includes('/?')) {
    write(help[name] || '此命令尚未实现。');
    return;
  }
  switch (name) {
    case 'CLS':
      transcript.value = '';
      return;
    case 'EXIT':
      win?.close();
      return;
    case 'VER':
      write('Vtron 命令提示符（虚拟文件系统）');
      return;
    case 'DATE':
      write('当前日期: ' + new Date().toLocaleDateString('zh-CN'));
      return;
    case 'TIME':
      write('当前时间: ' + new Date().toLocaleTimeString('zh-CN', { hour12: false }));
      return;
    case 'ECHO':
      write(line.replace(/^\s*echo(?:\s|$)/i, '') || 'ECHO 处于打开状态。');
      return;
    case 'HELP': {
      const target = args[0]?.toUpperCase();
      if (target) write(help[target] || '此命令尚未实现。');
      else {
        write('支持以下虚拟文件系统命令：\n');
        for (const [key, description] of Object.entries(help)) write(key.padEnd(9) + description);
        write('\nWindows 程序、批处理、管道和系统管理命令尚未实现。');
      }
      return;
    }
    case 'CD':
    case 'CHDIR': {
      const parts = args.filter((value) => value.toLowerCase() !== '/d');
      if (!parts.length) {
        write(displayPath(cwd.value));
        return;
      }
      const path = resolvePath(parts.join(' '));
      const item = await system.fs.stat(path);
      if (!item?.isDirectory) {
        write('系统找不到指定的路径。');
        return;
      }
      if (!disposed) cwd.value = path;
      return;
    }
    case 'DIR': {
      const bare = args.some((value) => value.toLowerCase() === '/b');
      const parts = args.filter((value) => !['/b', '/a'].includes(value.toLowerCase()));
      const path = parts.length ? resolvePath(parts.join(' ')) : cwd.value;
      const item = await system.fs.stat(path);
      if (!item) {
        write('系统找不到指定的路径。');
        return;
      }
      const files = item.isDirectory ? await system.fs.readdir(path) : [item];
      files.sort(
        (a, b) =>
          Number(b.isDirectory) - Number(a.isDirectory) ||
          basename(a.path).localeCompare(basename(b.path), 'zh-CN')
      );
      if (!bare) write(` ${displayPath(path)} 的目录\n`);
      let count = 0,
        directories = 0,
        bytes = 0;
      for (const file of files) {
        if (bare) write(basename(file.path));
        else {
          const size = file.isDirectory ? '<DIR>'.padEnd(12) : String(file.size || 0).padStart(12);
          write(`${stamp(file.mtime)}    ${size} ${basename(file.path)}`);
        }
        if (file.isDirectory) directories++;
        else {
          count++;
          bytes += file.size || 0;
        }
      }
      if (!bare) write(`\n ${count} 个文件  ${bytes} 字节\n ${directories} 个目录`);
      return;
    }
    case 'TYPE': {
      if (!args.length) {
        write('命令语法不正确。');
        return;
      }
      const path = resolvePath(args.join(' '));
      const item = await system.fs.stat(path);
      if (!item?.isFile) {
        write('系统找不到指定的文件。');
        return;
      }
      if (item.size > 65536) {
        write('仅支持查看不超过 64 KB 的文本文件。');
        return;
      }
      const content = await system.fs.readFile(path);
      if (content === null || /\0/.test(content) || /^data:(?:image|audio|video)\//.test(content)) {
        write('无法将此文件显示为文本。');
        return;
      }
      write(content.replace(/\r\n/g, '\n'));
      return;
    }
    default:
      write(`'${name.toLowerCase()}' 不是此环境支持的命令。\n输入 HELP 查看可用命令。`);
  }
}
async function submit() {
  if (busy.value) return;
  const line = command.value;
  command.value = '';
  write(`${displayPath(cwd.value)}>${line}`);
  if (!line.trim()) {
    await scrollToInput();
    return;
  }
  if (history[history.length - 1] !== line) history.push(line);
  historyIndex = history.length;
  draft = '';
  busy.value = true;
  try {
    await execute(line);
  } catch (error) {
    write(error instanceof Error ? error.message : '命令执行失败。');
  } finally {
    if (!disposed) {
      busy.value = false;
      if (line.trim().toUpperCase() !== 'CLS') write();
      await scrollToInput();
    }
  }
}
function onKeydown(event: KeyboardEvent) {
  if (event.isComposing) return;
  if (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === 'c' &&
    !window.getSelection()?.toString()
  ) {
    event.preventDefault();
    write(`${displayPath(cwd.value)}>${command.value}^C\n`);
    command.value = '';
    void scrollToInput();
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    if (historyIndex === history.length) draft = command.value;
    historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
    command.value = historyIndex === history.length ? draft : history[historyIndex];
  }
}
onMounted(() => void scrollToInput());
onUnmounted(() => {
  disposed = true;
});
</script>

<style scoped>
.command-console {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #0c0c0c;
  color: #ccc;
  padding: 0 2px 10px;
  cursor: text;
  font:
    14px/18px Consolas,
    'Lucida Console',
    'Courier New',
    monospace;
}
.command-console * {
  box-sizing: border-box;
}
.transcript {
  margin: 0;
  font: inherit;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.command-line {
  display: flex;
  align-items: baseline;
  margin: 0;
  font: inherit;
}
.command-line span {
  flex-shrink: 0;
  white-space: pre;
}
.command-line input {
  flex: 1;
  width: 0;
  min-width: 24px;
  margin: 0;
  padding: 0;
  border: 0;
  outline: 0;
  border-radius: 0;
  color: inherit;
  background: transparent;
  caret-color: #ccc;
  font: inherit;
  line-height: inherit;
}
.command-console::-webkit-scrollbar {
  width: 16px;
}
.command-console::-webkit-scrollbar-track {
  background: #252525;
}
.command-console::-webkit-scrollbar-thumb {
  background: #666;
  border: 3px solid #252525;
}
</style>
