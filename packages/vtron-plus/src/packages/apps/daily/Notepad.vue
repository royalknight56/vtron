<template>
  <Win10Frame :title="title" :icon="win?.windowInfo.icon" background="#fff" :before-close="confirmDiscard">
    <div class="notepad" @keydown="onKeydown" @mousedown.capture="dismissMenu">
      <nav class="menu-bar" aria-label="记事本菜单">
        <div v-for="menu in menus" :key="menu.id" class="menu-root">
          <button
            :class="{ active: activeMenu === menu.id }"
            :aria-expanded="activeMenu === menu.id"
            @mousedown.prevent
            @click="
              activeMenu = activeMenu === menu.id ? '' : menu.id;
              activeSubmenu = '';
            "
          >
            {{ menu.label }}
          </button>
          <div v-if="activeMenu === menu.id" class="menu-popup" role="menu" @mousedown.prevent>
            <template v-for="(item, index) in menu.items" :key="index"
              ><div v-if="item.separator" class="menu-separator"></div>
              <div
                v-else
                class="submenu-root"
                @mouseenter="activeSubmenu = item.children ? item.label || '' : ''"
              >
                <button role="menuitem" :disabled="item.disabled" @click="runMenu(item)">
                  <span class="menu-check">{{ item.checked ? '✓' : '' }}</span
                  ><span>{{ item.label }}</span
                  ><span class="menu-shortcut">{{ item.shortcut }}</span
                  ><span v-if="item.children" class="mdl menu-arrow" aria-hidden="true">&#xE76C;</span>
                </button>
                <div
                  v-if="item.children && activeSubmenu === item.label"
                  class="menu-popup submenu"
                  role="menu"
                >
                  <button
                    v-for="child in item.children"
                    :key="child.label"
                    role="menuitem"
                    :disabled="child.disabled"
                    @click="runMenu(child)"
                  >
                    <span class="menu-check"></span><span>{{ child.label }}</span
                    ><span class="menu-shortcut">{{ child.shortcut }}</span>
                  </button>
                </div>
              </div></template
            >
          </div>
        </div>
      </nav>
      <textarea
        ref="editor"
        class="editor"
        :value="text"
        :wrap="wordWrap ? 'soft' : 'off'"
        :spellcheck="false"
        aria-label="文本文档"
        :style="{
          fontFamily,
          fontSize: (fontSize * zoom) / 100 + 'px',
          fontWeight: fontBold ? 'bold' : 'normal',
          fontStyle: fontItalic ? 'italic' : 'normal',
        }"
        @beforeinput="beforeInput"
        @input="onInput"
        @select="updateCursor"
        @click="updateCursor"
        @keyup="updateCursor"
      ></textarea>
      <footer v-if="showStatus" class="status-bar">
        <span class="status-space"></span
        ><span class="position">第 {{ lineNumber }} 行，第 {{ columnNumber }} 列</span
        ><span class="zoom">{{ zoom }}%</span
        ><span class="line-ending">{{ lineEnding === 'CRLF' ? 'Windows (CRLF)' : 'Unix (LF)' }}</span
        ><span class="encoding">UTF-8</span>
      </footer>
      <div
        v-if="findOpen"
        class="find-dialog"
        role="dialog"
        :aria-label="replaceMode ? '替换' : '查找'"
        @keydown.esc.stop="findOpen = false"
      >
        <header class="dialog-title">
          <span>{{ replaceMode ? '替换' : '查找' }}</span
          ><button aria-label="关闭查找" @click="findOpen = false">
            <span class="mdl" aria-hidden="true">&#xE8BB;</span>
          </button>
        </header>
        <div class="find-body">
          <div class="find-fields">
            <label
              >查找内容(N)：<input
                ref="findInput"
                v-model="findQuery"
                @keydown.enter.prevent="findNext" /></label
            ><label v-if="replaceMode"
              >替换为(P)：<input v-model="replaceQuery" @keydown.enter.prevent="replaceOne" /></label
            ><label class="check-label"><input v-model="matchCase" type="checkbox" />区分大小写(C)</label
            ><label class="check-label"><input v-model="wrapSearch" type="checkbox" />循环搜索(R)</label>
            <p v-if="findMessage" class="find-message" role="status">{{ findMessage }}</p>
          </div>
          <div class="find-buttons">
            <button :disabled="!findQuery" @click="findNext">查找下一个(F)</button
            ><button v-if="replaceMode" :disabled="!findQuery" @click="replaceOne">替换(R)</button
            ><button v-if="replaceMode" :disabled="!findQuery" @click="replaceAll">全部替换(A)</button
            ><button @click="findOpen = false">取消</button>
          </div>
        </div>
      </div>
      <div v-if="pathPrompt" class="dialog-backdrop" @keydown.esc.stop="finishPath(null)">
        <form
          class="path-dialog"
          role="dialog"
          aria-modal="true"
          :aria-label="pathPrompt.kind === 'open' ? '打开' : '另存为'"
          @submit.prevent="finishPath(pathPrompt.value)"
        >
          <header class="dialog-title">
            <span>{{ pathPrompt.kind === 'open' ? '打开' : '另存为' }}</span
            ><button type="button" aria-label="关闭文件对话框" @click="finishPath(null)">
              <span class="mdl" aria-hidden="true">&#xE8BB;</span>
            </button>
          </header>
          <div class="path-body">
            <label
              >文件名(N)：<input
                ref="pathInput"
                v-model="pathPrompt.value"
                autocomplete="off"
                aria-label="文件名或完整路径"
            /></label>
            <div class="dialog-buttons">
              <button type="submit" :disabled="!pathPrompt.value.trim()">
                {{ pathPrompt.kind === 'open' ? '打开(O)' : '保存(S)' }}</button
              ><button type="button" @click="finishPath(null)">取消</button>
            </div>
          </div>
        </form>
      </div>
      <div v-if="fontOpen" class="dialog-backdrop" @keydown.esc.stop="fontOpen = false">
        <div class="font-dialog" role="dialog" aria-modal="true" aria-label="字体">
          <header class="dialog-title">
            <span>字体</span
            ><button aria-label="关闭字体设置" @click="fontOpen = false">
              <span class="mdl" aria-hidden="true">&#xE8BB;</span>
            </button>
          </header>
          <div class="font-body">
            <div class="font-selects">
              <label
                >字体(F)：<select v-model="draftFont" size="6">
                  <option v-for="font in fonts" :key="font" :value="font">{{ font }}</option>
                </select></label
              ><label
                >字形(Y)：<select v-model="draftStyle" size="6">
                  <option value="regular">常规</option>
                  <option value="italic">倾斜</option>
                  <option value="bold">粗体</option>
                  <option value="bolditalic">粗偏斜体</option>
                </select></label
              ><label
                >大小(S)：<select v-model="draftSize" size="6">
                  <option v-for="size in fontSizes" :key="size" :value="size">{{ size }}</option>
                </select></label
              >
            </div>
            <fieldset class="font-example">
              <legend>示例</legend>
              <span
                :style="{
                  fontFamily: draftFont,
                  fontSize: draftSize + 'px',
                  fontWeight: draftStyle.includes('bold') ? 'bold' : 'normal',
                  fontStyle: draftStyle.includes('italic') ? 'italic' : 'normal',
                }"
                >AaBbYyZz 中文</span
              >
            </fieldset>
            <div class="dialog-buttons">
              <button @click="applyFont">确定</button><button @click="fontOpen = false">取消</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Win10Frame>
</template>
<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { BrowserWindow, Dialog, System, basename, dirname, join, normalize } from 'vtron';
import Win10Frame from './Win10Frame.vue';
const sys = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');
const editor = ref<HTMLTextAreaElement>();
const text = ref('');
const baseline = ref('');
const path = ref('');
const busy = ref(false);
const dirty = computed(() => text.value !== baseline.value);
const title = computed(
  () => `${dirty.value ? '*' : ''}${path.value ? basename(path.value) : '无标题'} - 记事本`
);
watch(title, (value) => win?.setTitle(value), { immediate: true });
const userPath = sys._options.userLocation || '/C/Users/';
const activeMenu = ref('');
const activeSubmenu = ref('');
const wordWrap = ref(false);
const showStatus = ref(true);
const zoom = ref(100);
const fontFamily = ref('Consolas, "Microsoft YaHei", monospace');
const fontSize = ref(16);
const fontBold = ref(false);
const fontItalic = ref(false);
const lineEnding = ref<'CRLF' | 'LF'>('CRLF');
const cursor = ref(0);
const selectionLength = ref(0);
const lineNumber = computed(() => text.value.slice(0, cursor.value).split('\n').length);
const columnNumber = computed(() => {
  const before = text.value.slice(0, cursor.value);
  return before.length - before.lastIndexOf('\n');
});
type Snapshot = { text: string; start: number; end: number };
const undoStack = ref<Snapshot[]>([]);
const redoStack = ref<Snapshot[]>([]);
let beforeEdit: Snapshot | null = null;
function snapshot(): Snapshot {
  return {
    text: text.value,
    start: editor.value?.selectionStart ?? cursor.value,
    end: editor.value?.selectionEnd ?? cursor.value,
  };
}
function beforeInput() {
  beforeEdit = snapshot();
}
function onInput(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value;
  if (value !== text.value) {
    undoStack.value.push(beforeEdit || snapshot());
    if (undoStack.value.length > 100) undoStack.value.shift();
    redoStack.value = [];
    text.value = value;
  }
  beforeEdit = null;
  updateCursor();
}
function updateCursor() {
  cursor.value = editor.value?.selectionStart ?? 0;
  selectionLength.value = (editor.value?.selectionEnd ?? 0) - cursor.value;
}
async function restoreSnapshot(value: Snapshot) {
  text.value = value.text;
  await nextTick();
  editor.value?.focus({ preventScroll: true });
  editor.value?.setSelectionRange(value.start, value.end);
  updateCursor();
}
function undo() {
  const previous = undoStack.value.pop();
  if (previous) {
    redoStack.value.push(snapshot());
    void restoreSnapshot(previous);
  }
}
function redo() {
  const next = redoStack.value.pop();
  if (next) {
    undoStack.value.push(snapshot());
    void restoreSnapshot(next);
  }
}
async function replaceRange(start: number, end: number, value: string) {
  undoStack.value.push(snapshot());
  if (undoStack.value.length > 100) undoStack.value.shift();
  redoStack.value = [];
  text.value = text.value.slice(0, start) + value + text.value.slice(end);
  await nextTick();
  editor.value?.focus({ preventScroll: true });
  editor.value?.setSelectionRange(start + value.length, start + value.length);
  updateCursor();
}
function selectAll() {
  editor.value?.focus({ preventScroll: true });
  editor.value?.select();
  updateCursor();
}
async function copySelection(cut = false) {
  const current = snapshot();
  if (current.start === current.end) return;
  try {
    await navigator.clipboard.writeText(current.text.slice(current.start, current.end));
    if (cut) await replaceRange(current.start, current.end, '');
  } catch {
    await showError('无法访问剪贴板。请使用键盘快捷键。');
  }
}
async function paste() {
  try {
    const value = await navigator.clipboard.readText();
    const current = snapshot();
    await replaceRange(current.start, current.end, value.replace(/\r\n?/g, '\n'));
  } catch {
    await showError('无法访问剪贴板。请使用 Ctrl+V 粘贴。');
  }
}
async function showError(message: string) {
  await Dialog.showMessageBox({ title: '记事本', message, type: 'error', buttons: ['确定'] });
}
function normalizeInputPath(value: string) {
  const converted = value
    .trim()
    .replace(/^([a-z]):/i, (_, drive: string) => '/' + drive.toUpperCase())
    .replaceAll('\\', '/');
  return normalize(converted.startsWith('/') ? converted : join(userPath, 'Desktop', converted));
}
const pathPrompt = ref<{ kind: 'open' | 'save'; value: string } | null>(null);
const pathInput = ref<HTMLInputElement>();
let resolvePath: ((value: string | null) => void) | undefined;
async function askPath(kind: 'open' | 'save', value: string): Promise<string | null> {
  if (resolvePath) return null;
  const answer = new Promise<string | null>((resolve) => {
    resolvePath = resolve;
  });
  pathPrompt.value = { kind, value };
  await nextTick();
  pathInput.value?.focus({ preventScroll: true });
  pathInput.value?.select();
  return answer;
}
function finishPath(value: string | null) {
  const resolve = resolvePath;
  resolvePath = undefined;
  pathPrompt.value = null;
  resolve?.(value);
}
async function confirmDiscard() {
  if (pathPrompt.value) {
    finishPath(null);
    return false;
  }
  if (busy.value) return false;
  if (!dirty.value) return true;
  const answer = await Dialog.showMessageBox({
    title: '记事本',
    message: `是否将更改保存到 ${path.value ? basename(path.value) : '无标题'}？`,
    type: 'question',
    buttons: ['保存', '不保存', '取消'],
  });
  if (answer.response === 0) return save();
  return answer.response === 1;
}
async function newDocument() {
  if (!(await confirmDiscard())) return;
  text.value = '';
  baseline.value = '';
  path.value = '';
  lineEnding.value = 'CRLF';
  undoStack.value = [];
  redoStack.value = [];
  await nextTick();
  editor.value?.focus({ preventScroll: true });
  updateCursor();
}
async function readDocument(filePath: string) {
  busy.value = true;
  try {
    const info = await sys.fs.stat(filePath);
    if (!info || info.isDirectory) throw new Error('找不到指定的文本文件。');
    const value = await sys.fs.readFile(filePath);
    if (typeof value !== 'string') throw new Error('无法读取此文本文件。');
    lineEnding.value = value.includes('\r\n') || !value.includes('\n') ? 'CRLF' : 'LF';
    text.value = value.replace(/\r\n?/g, '\n');
    baseline.value = text.value;
    path.value = filePath;
    undoStack.value = [];
    redoStack.value = [];
    await nextTick();
    editor.value?.setSelectionRange(0, 0);
    updateCursor();
  } catch (error) {
    await showError(error instanceof Error ? error.message : '无法打开文件。');
  } finally {
    busy.value = false;
  }
}
async function openDocument() {
  if (busy.value || !(await confirmDiscard())) return;
  const answer = await askPath('open', path.value || join(userPath, 'Desktop', '文本文档.txt'));
  if (answer?.trim()) await readDocument(normalizeInputPath(answer));
}
async function save(asNew = false): Promise<boolean> {
  if (busy.value) return false;
  let destination = path.value;
  if (asNew || !destination) {
    const answer = await askPath('save', destination || join(userPath, 'Desktop', '无标题.txt'));
    if (!answer?.trim()) return false;
    destination = normalizeInputPath(answer);
    if (!basename(destination).includes('.')) destination += '.txt';
    if (
      dirname(destination) === '/' ||
      !basename(destination) ||
      /[\\/:*?"<>|]/.test(basename(destination))
    ) {
      await showError('请在磁盘中的文件夹内保存文件，并使用有效文件名。');
      return false;
    }
    if (destination !== path.value && (await sys.fs.exists(destination))) {
      const answer = await Dialog.showMessageBox({
        title: '确认另存为',
        message: `${basename(destination)} 已存在。是否替换？`,
        type: 'warning',
        buttons: ['替换', '取消'],
      });
      if (answer.response !== 0) return false;
    }
  }
  busy.value = true;
  const value = text.value;
  try {
    const folder = await sys.fs.stat(dirname(destination));
    if (!folder?.isDirectory) throw new Error('指定的文件夹不存在。');
    await sys.fs.writeFile(destination, lineEnding.value === 'CRLF' ? value.replace(/\n/g, '\r\n') : value);
    baseline.value = value;
    path.value = destination;
    sys.refershApp();
    return true;
  } catch (error) {
    await showError(error instanceof Error ? error.message : '无法保存文件。');
    return false;
  } finally {
    busy.value = false;
  }
}
function closeDocument() {
  win?.close();
}
const findOpen = ref(false);
const replaceMode = ref(false);
const findQuery = ref('');
const replaceQuery = ref('');
const matchCase = ref(false);
const wrapSearch = ref(true);
const findMessage = ref('');
const findInput = ref<HTMLInputElement>();
async function openFind(replace = false) {
  replaceMode.value = replace;
  const selected = snapshot();
  if (selected.start !== selected.end) findQuery.value = selected.text.slice(selected.start, selected.end);
  findMessage.value = '';
  findOpen.value = true;
  await nextTick();
  findInput.value?.focus({ preventScroll: true });
  findInput.value?.select();
}
function findNext() {
  if (!findQuery.value) return;
  const haystack = matchCase.value ? text.value : text.value.toLocaleLowerCase();
  const needle = matchCase.value ? findQuery.value : findQuery.value.toLocaleLowerCase();
  let index = haystack.indexOf(needle, editor.value?.selectionEnd ?? 0);
  if (index < 0 && wrapSearch.value) index = haystack.indexOf(needle);
  if (index < 0) {
    findMessage.value = `找不到“${findQuery.value}”。`;
    return;
  }
  editor.value?.focus({ preventScroll: true });
  editor.value?.setSelectionRange(index, index + findQuery.value.length);
  updateCursor();
  findMessage.value = '';
}
async function replaceOne() {
  const current = snapshot();
  const selected = current.text.slice(current.start, current.end);
  if (
    (matchCase.value ? selected : selected.toLocaleLowerCase()) !==
    (matchCase.value ? findQuery.value : findQuery.value.toLocaleLowerCase())
  ) {
    findNext();
    return;
  }
  await replaceRange(current.start, current.end, replaceQuery.value);
  findNext();
}
async function replaceAll() {
  if (!findQuery.value) return;
  const source = matchCase.value ? text.value : text.value.toLocaleLowerCase();
  const needle = matchCase.value ? findQuery.value : findQuery.value.toLocaleLowerCase();
  let from = 0;
  let output = '';
  let count = 0;
  let index = source.indexOf(needle);
  while (index >= 0) {
    output += text.value.slice(from, index) + replaceQuery.value;
    from = index + findQuery.value.length;
    count++;
    index = source.indexOf(needle, from);
  }
  if (count) await replaceRange(0, text.value.length, output + text.value.slice(from));
  findMessage.value = count ? `已替换 ${count} 处。` : `找不到“${findQuery.value}”。`;
}
const fontOpen = ref(false);
const fonts = ['Consolas', 'Lucida Console', 'Courier New', 'Arial', 'Microsoft YaHei'];
const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
const draftFont = ref('Consolas');
const draftSize = ref(16);
const draftStyle = ref('regular');
function openFont() {
  draftFont.value = fontFamily.value.split(',')[0];
  draftSize.value = fontSize.value;
  draftStyle.value =
    fontBold.value && fontItalic.value
      ? 'bolditalic'
      : fontBold.value
        ? 'bold'
        : fontItalic.value
          ? 'italic'
          : 'regular';
  fontOpen.value = true;
}
function applyFont() {
  fontFamily.value = `${draftFont.value}, "Microsoft YaHei", monospace`;
  fontSize.value = Number(draftSize.value);
  fontBold.value = draftStyle.value.includes('bold');
  fontItalic.value = draftStyle.value.includes('italic');
  fontOpen.value = false;
}
function changeZoom(delta: number) {
  zoom.value = Math.max(10, Math.min(500, zoom.value + delta));
}
interface MenuItem {
  label?: string;
  shortcut?: string;
  action?: () => unknown;
  disabled?: boolean;
  checked?: boolean;
  separator?: boolean;
  children?: MenuItem[];
}
const menus = computed<{ id: string; label: string; items: MenuItem[] }[]>(() => [
  {
    id: 'file',
    label: '文件(F)',
    items: [
      { label: '新建(N)', shortcut: 'Ctrl+N', action: newDocument, disabled: busy.value },
      { label: '新窗口(W)', shortcut: 'Ctrl+Shift+N', disabled: true },
      { label: '打开(O)…', shortcut: 'Ctrl+O', action: openDocument, disabled: busy.value },
      { label: '保存(S)', shortcut: 'Ctrl+S', action: () => save(), disabled: busy.value },
      { label: '另存为(A)…', shortcut: 'Ctrl+Shift+S', action: () => save(true), disabled: busy.value },
      { separator: true },
      { label: '页面设置(U)…', disabled: true },
      { label: '打印(P)…', shortcut: 'Ctrl+P', disabled: true },
      { separator: true },
      { label: '退出(X)', action: closeDocument },
    ],
  },
  {
    id: 'edit',
    label: '编辑(E)',
    items: [
      { label: '撤销(U)', shortcut: 'Ctrl+Z', action: undo, disabled: !undoStack.value.length },
      { label: '重做(R)', shortcut: 'Ctrl+Y', action: redo, disabled: !redoStack.value.length },
      { separator: true },
      {
        label: '剪切(T)',
        shortcut: 'Ctrl+X',
        action: () => copySelection(true),
        disabled: !selectionLength.value || !navigator.clipboard?.writeText,
      },
      {
        label: '复制(C)',
        shortcut: 'Ctrl+C',
        action: () => copySelection(),
        disabled: !selectionLength.value || !navigator.clipboard?.writeText,
      },
      { label: '粘贴(P)', shortcut: 'Ctrl+V', action: paste, disabled: !navigator.clipboard?.readText },
      {
        label: '删除(L)',
        shortcut: 'Del',
        action: () => {
          const current = snapshot();
          return replaceRange(current.start, current.end, '');
        },
        disabled: !selectionLength.value,
      },
      { separator: true },
      { label: '使用 Bing 搜索(S)…', shortcut: 'Ctrl+E', disabled: true },
      { label: '查找(F)…', shortcut: 'Ctrl+F', action: () => openFind(), disabled: !text.value },
      { label: '查找下一个(N)', shortcut: 'F3', action: findNext, disabled: !findQuery.value },
      { label: '替换(R)…', shortcut: 'Ctrl+H', action: () => openFind(true) },
      { label: '转到(G)…', shortcut: 'Ctrl+G', disabled: true },
      { separator: true },
      { label: '全选(A)', shortcut: 'Ctrl+A', action: selectAll },
      {
        label: '时间/日期(D)',
        shortcut: 'F5',
        action: () => {
          const current = snapshot();
          return replaceRange(current.start, current.end, new Date().toLocaleString());
        },
      },
    ],
  },
  {
    id: 'format',
    label: '格式(O)',
    items: [
      { label: '自动换行(W)', checked: wordWrap.value, action: () => (wordWrap.value = !wordWrap.value) },
      { label: '字体(F)…', action: openFont },
    ],
  },
  {
    id: 'view',
    label: '查看(V)',
    items: [
      {
        label: '缩放(Z)',
        children: [
          {
            label: '放大(I)',
            shortcut: 'Ctrl+加号',
            action: () => changeZoom(10),
            disabled: zoom.value >= 500,
          },
          {
            label: '缩小(O)',
            shortcut: 'Ctrl+减号',
            action: () => changeZoom(-10),
            disabled: zoom.value <= 10,
          },
          { label: '还原默认缩放', shortcut: 'Ctrl+0', action: () => (zoom.value = 100) },
        ],
      },
      { label: '状态栏(S)', checked: showStatus.value, action: () => (showStatus.value = !showStatus.value) },
    ],
  },
  {
    id: 'help',
    label: '帮助(H)',
    items: [
      { label: '查看帮助(H)', disabled: true },
      { label: '发送反馈(F)', disabled: true },
      { separator: true },
      {
        label: '关于记事本(A)',
        action: () => Dialog.showMessageBox({ title: '关于记事本', message: '记事本', buttons: ['确定'] }),
      },
    ],
  },
]);
function runMenu(item: MenuItem) {
  if (item.disabled) return;
  if (item.children) {
    activeSubmenu.value = item.label || '';
    return;
  }
  activeMenu.value = '';
  activeSubmenu.value = '';
  void item.action?.();
}
function dismissMenu(event: MouseEvent) {
  if (!(event.target as Element).closest('.menu-bar')) {
    activeMenu.value = '';
    activeSubmenu.value = '';
  }
}
function onKeydown(event: KeyboardEvent) {
  if (
    pathPrompt.value ||
    fontOpen.value ||
    (findOpen.value && (event.target as HTMLElement).closest('.find-dialog'))
  )
    return;
  if (event.key === 'Escape') {
    activeMenu.value = '';
    findOpen.value = false;
    return;
  }
  const modifier = event.ctrlKey || event.metaKey;
  let handled = true;
  if (modifier && event.key.toLowerCase() === 'n') {
    if (!event.shiftKey) void newDocument();
  } else if (modifier && event.key.toLowerCase() === 'o') void openDocument();
  else if (modifier && event.key.toLowerCase() === 's') void save(event.shiftKey);
  else if (modifier && event.key.toLowerCase() === 'f') void openFind();
  else if (modifier && event.key.toLowerCase() === 'h') void openFind(true);
  else if (modifier && event.key.toLowerCase() === 'z') event.shiftKey ? redo() : undo();
  else if (modifier && event.key.toLowerCase() === 'y') redo();
  else if (modifier && ['p', 'e', 'g'].includes(event.key.toLowerCase())) {
    /* unavailable native commands */
  } else if (modifier && ['+', '='].includes(event.key)) changeZoom(10);
  else if (modifier && event.key === '-') changeZoom(-10);
  else if (modifier && event.key === '0') zoom.value = 100;
  else if (event.key === 'F3') findNext();
  else if (event.key === 'F5') {
    const current = snapshot();
    void replaceRange(current.start, current.end, new Date().toLocaleString());
  } else handled = false;
  if (handled) event.preventDefault();
}
onUnmounted(() => finishPath(null));
onMounted(async () => {
  const initialPath = win?.config?.path;
  if (typeof initialPath === 'string' && initialPath) await readDocument(normalizeInputPath(initialPath));
  else if (typeof win?.config?.content === 'string') text.value = win.config.content.replace(/\r\n?/g, '\n');
  await nextTick();
  editor.value?.focus({ preventScroll: true });
  updateCursor();
});
</script>
<style scoped>
.notepad,
.notepad *,
.notepad *::before,
.notepad *::after {
  box-sizing: border-box;
}
.notepad {
  position: relative;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: #fff;
  color: #000;
}
button,
input,
select {
  font:
    12px/1.35 'Segoe UI',
    'Microsoft YaHei UI',
    sans-serif;
  color: #000;
  border-radius: 0;
}
button {
  cursor: default;
  border: 1px solid transparent;
  background: transparent;
}
button:disabled {
  color: #999;
}
button:focus-visible {
  outline: 1px dotted #333;
  outline-offset: -3px;
}
.mdl {
  font: 10px/1 'SEGOEUIMDL';
}
.menu-bar {
  position: relative;
  display: flex;
  align-items: center;
  height: 20px;
  flex-shrink: 0;
  background: #fff;
  border-bottom: 1px solid #eee;
  user-select: none;
  z-index: 3;
}
.menu-root {
  position: relative;
  height: 20px;
}
.menu-root > button {
  height: 20px;
  padding: 0 7px;
  white-space: nowrap;
}
.menu-root > button:hover,
.menu-root > button.active {
  background: #e5f3ff;
  border-color: #cce8ff;
}
.menu-popup {
  position: absolute;
  left: 0;
  top: 20px;
  z-index: 4;
  min-width: 260px;
  padding: 3px;
  border: 1px solid #a0a0a0;
  background: #f2f2f2;
  box-shadow: 2px 2px 3px #0004;
}
.menu-popup button {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 24px;
  padding: 0 7px 0 0;
  text-align: left;
  white-space: nowrap;
  border: 0;
}
.menu-popup button:hover:enabled {
  background: #91c9f7;
}
.menu-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 27px;
  flex-shrink: 0;
}
.menu-shortcut {
  padding-left: 35px;
  margin-left: auto;
}
.menu-arrow {
  margin-left: 10px;
  font-size: 8px;
}
.menu-separator {
  height: 1px;
  margin: 3px 0 3px 27px;
  background: #d7d7d7;
}
.submenu-root {
  position: relative;
}
.menu-popup.submenu {
  top: -3px;
  left: 100%;
  min-width: 248px;
}
.editor {
  display: block;
  flex: 1;
  min-height: 0;
  width: 100%;
  padding: 1px 3px;
  margin: 0;
  border: 0;
  outline: 0;
  resize: none;
  color: #000;
  background: #fff;
  line-height: 1.3;
  tab-size: 8;
  overflow: scroll;
}
.status-bar {
  height: 23px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  background: #f0f0f0;
  border-top: 1px solid #d8d8d8;
  color: #333;
  font:
    12px/1.35 'Segoe UI',
    sans-serif;
  user-select: none;
}
.status-space {
  flex: 1;
}
.status-bar > span:not(.status-space) {
  display: flex;
  align-items: center;
  height: 22px;
  border-left: 1px solid #d7d7d7;
  padding: 0 12px;
  white-space: nowrap;
}
.position {
  min-width: 132px;
}
.zoom {
  min-width: 50px;
}
.line-ending {
  min-width: 120px;
}
.encoding {
  min-width: 120px;
}
.find-dialog,
.font-dialog {
  background: #f0f0f0;
  box-shadow: 0 4px 18px #0004;
  border: 1px solid #777;
  font:
    12px/1.35 'Segoe UI',
    'Microsoft YaHei UI',
    sans-serif;
}
.find-dialog {
  position: absolute;
  top: 36px;
  right: 22px;
  z-index: 5;
  width: 390px;
}
.dialog-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  padding-left: 8px;
  background: #fff;
  user-select: none;
}
.dialog-title button {
  width: 40px;
  height: 30px;
  border: 0;
}
.dialog-title button:hover {
  background: #e81123;
  color: #fff;
}
.find-body {
  display: flex;
  gap: 10px;
  padding: 12px;
}
.find-fields {
  flex: 1;
  min-width: 0;
}
.find-fields > label:not(.check-label) {
  display: grid;
  grid-template-columns: 83px minmax(0, 1fr);
  align-items: center;
  margin-bottom: 9px;
}
.find-fields input:not([type='checkbox']) {
  width: 100%;
  min-width: 0;
  padding: 2px 4px;
  height: 23px;
  border: 1px solid #888;
  background: white;
}
.check-label {
  display: flex;
  align-items: center;
  margin: 7px 0 0 0;
}
.check-label input {
  margin: 0 5px 0 0;
}
.find-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 92px;
}
.find-buttons button,
.dialog-buttons button {
  height: 25px;
  min-width: 75px;
  padding: 0 7px;
  border: 1px solid #adadad;
  background: #e1e1e1;
}
.find-buttons button:hover:enabled,
.dialog-buttons button:hover {
  border-color: #0078d7;
  background: #e5f1fb;
}
.find-message {
  margin: 8px 0 0;
  color: #555;
  overflow-wrap: anywhere;
}
.dialog-backdrop {
  position: absolute;
  z-index: 6;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0001;
}
.font-dialog {
  width: 420px;
  max-width: calc(100% - 20px);
}
.font-body {
  padding: 12px;
}
.font-selects {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 100px 65px;
  gap: 10px;
}
.font-selects label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.font-selects select {
  width: 100%;
  height: 110px;
  background: white;
  border: 1px solid #888;
  outline: none;
}
.font-example {
  margin: 12px 0;
  height: 95px;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #aaa;
  overflow: hidden;
}
.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.editor::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}
.editor::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.editor::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border: 2px solid #f1f1f1;
}
@container (max-width: 500px) {
  .position {
    min-width: 120px;
  }
  .status-bar > span:not(.status-space) {
    padding: 0 6px;
  }
  .find-dialog {
    right: 8px;
    width: calc(100% - 16px);
  }
}
.path-dialog {
  width: 450px;
  max-width: calc(100% - 24px);
  border: 1px solid #777;
  background: #f0f0f0;
  box-shadow: 0 4px 18px #0004;
}
.path-body {
  padding: 18px 14px 12px;
}
.path-body label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  white-space: nowrap;
}
.path-body input {
  min-width: 0;
  flex: 1;
  height: 25px;
  padding: 2px 5px;
  border: 1px solid #888;
  background: white;
}
.path-body input:focus {
  border-color: #0078d7;
  outline: 1px solid #0078d7;
  outline-offset: -1px;
}
</style>
