<template>
  <Win10Frame
    :class="{ 'note-mode': !listView }"
    title="便笺"
    :background="listView ? '#fff' : palette[active.color].paper"
    :titlebar-background="listView ? '#fff' : palette[active.color].bar"
    :compact="!listView"
    :before-close="beforeClose"
  >
    <template #title>
      <template v-if="listView"><span class="list-title">便笺</span></template>
      <template v-else>
        <button
          class="title-button new-note"
          aria-label="新建便笺"
          title="新建便笺 (Ctrl+N)"
          @click="newNote"
        >
          <span class="mdl" aria-hidden="true">&#xE710;</span>
        </button>
        <div class="title-space"></div>
        <button
          v-if="saveError"
          class="title-button save-warning"
          title="便笺尚未保存"
          aria-label="便笺尚未保存"
        >
          <span class="mdl" aria-hidden="true">&#xE7BA;</span>
        </button>
        <button
          class="title-button"
          aria-label="更多选项"
          title="更多选项"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <span class="mdl" aria-hidden="true">&#xE712;</span>
        </button>
      </template>
    </template>
    <div v-if="listView" class="notes-list">
      <div class="list-actions">
        <button aria-label="新建便笺" title="新建便笺" @click="newNote">
          <span class="mdl" aria-hidden="true">&#xE710;</span></button
        ><span></span
        ><button aria-label="设置" title="设置" disabled>
          <span class="mdl" aria-hidden="true">&#xE713;</span>
        </button>
      </div>
      <input v-model="query" type="search" aria-label="搜索便笺" placeholder="搜索…" />
      <div class="note-cards">
        <button
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-card"
          :style="{ background: palette[note.color].paper, borderTopColor: palette[note.color].bar }"
          @click="openNote(note.id)"
        >
          <span>{{ plainText(note.html) || '空白便笺' }}</span
          ><time>{{ new Date(note.updatedAt).toLocaleDateString() }}</time>
        </button>
        <p v-if="!filteredNotes.length" class="empty-list">没有便笺</p>
      </div>
    </div>
    <div v-else class="note-page" @keydown="handleShortcut">
      <div v-if="menuOpen" class="note-menu">
        <div class="color-options">
          <button
            v-for="(color, index) in palette"
            :key="color.name"
            :style="{ background: color.bar }"
            :class="{ selected: active.color === index }"
            :aria-label="color.name"
            :title="color.name"
            @click="
              active.color = index;
              scheduleSave();
              menuOpen = false;
            "
          >
            <span v-if="active.color === index" class="mdl" aria-hidden="true">&#xE73E;</span>
          </button>
        </div>
        <button class="menu-item" @click="showList">
          <span class="mdl" aria-hidden="true">&#xE8FD;</span>便笺列表
        </button>
        <button class="menu-item" disabled>
          <span class="mdl" aria-hidden="true">&#xE753;</span>同步便笺
        </button>
        <button class="menu-item" @click="deleteNote">
          <span class="mdl" aria-hidden="true">&#xE74D;</span>删除便笺
        </button>
      </div>
      <div
        ref="editor"
        class="note-editor"
        :contenteditable="ready"
        role="textbox"
        aria-label="便笺内容"
        aria-multiline="true"
        spellcheck="false"
        @input="onInput"
        @paste="pastePlainText"
        @keyup="rememberSelection"
        @mouseup="rememberSelection"
        @focus="rememberSelection"
      ></div>
      <div class="format-toolbar" aria-label="文本格式">
        <button
          v-for="format in formats"
          :key="format.command"
          :aria-label="format.label"
          :title="format.label"
          :aria-pressed="formatStates[format.command] || false"
          @mousedown.prevent
          @click="formatText(format.command)"
        >
          <span
            :class="[format.command === 'insertUnorderedList' ? 'mdl' : 'text-format', format.command]"
            aria-hidden="true"
            >{{ format.icon }}</span
          ></button
        ><button aria-label="插入图片" title="插入图片" disabled>
          <span class="mdl" aria-hidden="true">&#xE8B9;</span>
        </button>
      </div>
    </div>
    <div v-if="saveError" class="save-error" role="alert">
      保存失败，请重试。<button @click="saveNow">重试</button>
    </div>
  </Win10Frame>
</template>
<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { BrowserWindow, Dialog, System } from 'vtron';
import Win10Frame from './Win10Frame.vue';
interface Note {
  id: string;
  html: string;
  color: number;
  updatedAt: number;
}
const system = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');
const palette = [
  { name: '黄色', paper: '#fff2ab', bar: '#ffeb81' },
  { name: '绿色', paper: '#d5f5bb', bar: '#b9e993' },
  { name: '粉色', paper: '#ffd7e8', bar: '#ffc3dc' },
  { name: '紫色', paper: '#e7d8f7', bar: '#d7c1ef' },
  { name: '蓝色', paper: '#d7efff', bar: '#b9e4ff' },
  { name: '灰色', paper: '#efefef', bar: '#d5d5d5' },
];
const formats = [
  { command: 'bold', label: '粗体 (Ctrl+B)', icon: 'B' },
  { command: 'italic', label: '斜体 (Ctrl+I)', icon: 'I' },
  { command: 'underline', label: '下划线 (Ctrl+U)', icon: 'U' },
  { command: 'strikeThrough', label: '删除线', icon: 'abc' },
  { command: 'insertUnorderedList', label: '项目符号列表', icon: '\uE8FD' },
];
const initial: Note = { id: crypto.randomUUID(), html: '', color: 0, updatedAt: Date.now() };
const notes = ref<Note[]>([initial]);
const activeId = ref(initial.id);
const active = computed(() => notes.value.find((note) => note.id === activeId.value) || notes.value[0]);
const listView = ref(false);
const query = ref('');
const menuOpen = ref(false);
const saveError = ref(false);
const editor = ref<HTMLElement>();
const formatStates = ref<Record<string, boolean>>({});
const filteredNotes = computed(() =>
  notes.value
    .filter((note) =>
      plainText(note.html).toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())
    )
    .sort((a, b) => b.updatedAt - a.updatedAt)
);
const folder = `${system._options.userLocation || '/C/Users/'}Note`;
const path = `${folder}/.sticky-notes.json`;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let writeQueue = Promise.resolve();
let bookmark: Range | undefined;
const ready = ref(false);
let alive = true;
function safeHtml(value: string) {
  const parsed = new DOMParser().parseFromString(value, 'text/html');
  const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'UL', 'OL', 'LI', 'BR', 'DIV', 'P']);
  function clean(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE)
      return (node.textContent || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
    if (!(node instanceof Element) || ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT'].includes(node.tagName))
      return '';
    const content = Array.from(node.childNodes).map(clean).join('');
    if (!allowed.has(node.tagName)) return content;
    const tag = node.tagName.toLowerCase();
    return tag === 'br' ? '<br>' : `<${tag}>${content}</${tag}>`;
  }
  return Array.from(parsed.body.childNodes).map(clean).join('');
}
function plainText(html: string) {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
}
async function renderEditor() {
  await nextTick();
  if (editor.value) {
    editor.value.innerHTML = safeHtml(active.value.html);
    editor.value.focus({ preventScroll: true });
  }
  bookmark = undefined;
  formatStates.value = {};
}
function rememberSelection() {
  const selection = window.getSelection();
  if (selection?.rangeCount && editor.value?.contains(selection.anchorNode))
    bookmark = selection.getRangeAt(0).cloneRange();
  for (const format of formats)
    formatStates.value[format.command] = !!document.queryCommandState(format.command);
}
function onInput() {
  if (!editor.value) return;
  active.value.html = safeHtml(editor.value.innerHTML);
  active.value.updatedAt = Date.now();
  scheduleSave();
  rememberSelection();
}
function restoreSelection() {
  editor.value?.focus({ preventScroll: true });
  if (bookmark && editor.value?.contains(bookmark.commonAncestorContainer)) {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(bookmark);
  }
}
function formatText(command: string) {
  if (!ready.value) return;
  restoreSelection();
  document.execCommand(command, false);
  onInput();
}
function pastePlainText(event: ClipboardEvent) {
  event.preventDefault();
  restoreSelection();
  document.execCommand('insertText', false, event.clipboardData?.getData('text/plain') || '');
  onInput();
}
function scheduleSave() {
  clearTimeout(saveTimer);
  if (ready.value)
    saveTimer = setTimeout(() => {
      void saveNow();
    }, 400);
}
function saveNow(): Promise<void> {
  clearTimeout(saveTimer);
  if (!ready.value) return Promise.resolve();
  const snapshot = JSON.stringify({ notes: notes.value, activeId: activeId.value });
  writeQueue = writeQueue
    .catch(() => {})
    .then(async () => {
      if (!(await system.fs.exists(folder))) await system.fs.mkdir(folder);
      await system.fs.writeFile(path, snapshot);
      saveError.value = false;
    })
    .catch(() => {
      saveError.value = true;
    });
  return writeQueue;
}
async function newNote() {
  if (!ready.value) return;
  const note: Note = { id: crypto.randomUUID(), html: '', color: 0, updatedAt: Date.now() };
  notes.value.unshift(note);
  activeId.value = note.id;
  listView.value = false;
  menuOpen.value = false;
  scheduleSave();
  await renderEditor();
}
async function openNote(id: string) {
  if (!ready.value) return;
  activeId.value = id;
  listView.value = false;
  menuOpen.value = false;
  await renderEditor();
}
async function showList() {
  await saveNow();
  listView.value = true;
  menuOpen.value = false;
}
async function deleteNote() {
  menuOpen.value = false;
  const result = await Dialog.showMessageBox({
    title: '删除便笺',
    message: '确定要删除此便笺吗？',
    type: 'warning',
    buttons: ['删除', '取消'],
  });
  if (result.response !== 0 || !alive) return;
  notes.value = notes.value.filter((note) => note.id !== activeId.value);
  if (!notes.value.length)
    notes.value.push({ id: crypto.randomUUID(), html: '', color: 0, updatedAt: Date.now() });
  activeId.value = notes.value[0].id;
  await saveNow();
  await renderEditor();
}
function handleShortcut(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
    event.preventDefault();
    void newNote();
  }
}
async function beforeClose() {
  await saveNow();
  if (!saveError.value) return true;
  const result = await Dialog.showMessageBox({
    title: '便笺',
    message: '便笺未能保存。仍要关闭吗？',
    type: 'warning',
    buttons: ['关闭', '取消'],
  });
  return result.response === 0;
}
onMounted(async () => {
  try {
    const saved = await system.fs.readFile(path);
    if (saved) {
      const data = JSON.parse(saved);
      if (Array.isArray(data.notes)) {
        const valid: Note[] = data.notes
          .filter((note: any) => note && typeof note.id === 'string' && typeof note.html === 'string')
          .map((note: any) => ({
            id: note.id,
            html: safeHtml(note.html),
            color: Number.isInteger(note.color) && palette[note.color] ? note.color : 0,
            updatedAt: Number.isFinite(note.updatedAt) ? note.updatedAt : Date.now(),
          }));
        if (valid.length) {
          notes.value = valid;
          activeId.value = valid.some((note) => note.id === data.activeId) ? data.activeId : valid[0].id;
        }
      }
    }
  } catch {
    saveError.value = true;
  }
  ready.value = true;
  if (alive) {
    win?.setTitle('便笺');
    await renderEditor();
  }
});
onUnmounted(() => {
  alive = false;
  clearTimeout(saveTimer);
  void saveNow();
});
</script>
<style scoped>
button,
input {
  font: inherit;
  color: inherit;
}
button {
  border: 0;
  border-radius: 0;
  background: transparent;
  cursor: default;
}
button:disabled {
  opacity: 0.35;
}
button:focus-visible {
  outline: 1px dotted #555;
  outline-offset: -3px;
}
.mdl {
  font: 16px/1 'SEGOEUIMDL';
}
.title-button {
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.title-button:hover {
  background: #0000000a;
}
.new-note {
  margin-left: -12px;
}
.note-mode :deep(.titlebar-leading) {
  gap: 0;
}
.note-mode :deep(.window-controls button) {
  width: 32px;
}
.title-space {
  flex: 1;
}
.list-title {
  font-weight: 600;
  font-size: 14px;
}
.note-page {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}
.note-editor {
  flex: 1;
  min-height: 0;
  padding: 13px 12px;
  overflow: auto;
  outline: none;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 14px;
  line-height: 1.45;
  color: #4a4735;
}
.note-editor :deep(ul),
.note-editor :deep(ol) {
  padding-left: 22px;
  margin: 0;
}
.note-editor :deep(p),
.note-editor :deep(div) {
  margin: 0;
}
.format-toolbar {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 40px;
  padding: 0;
  border-top: 1px solid #0000000b;
}
.format-toolbar button {
  width: 42px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #77704d;
}
.text-format {
  font:
    14px/1 'Segoe UI',
    sans-serif;
}
.text-format.bold {
  font-weight: 700;
}
.text-format.italic {
  font-family: Georgia, serif;
  font-style: italic;
}
.text-format.underline {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.text-format.strikeThrough {
  text-decoration: line-through;
}
.format-toolbar button:hover:enabled,
.format-toolbar button[aria-pressed='true'] {
  background: #0000000b;
}
.note-menu {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  padding-bottom: 4px;
  background: #f8f8f8;
  box-shadow: 0 3px 8px #0003;
}
.color-options {
  display: flex;
  height: 44px;
  padding: 5px;
  gap: 2px;
}
.color-options button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border: 1px solid transparent;
}
.color-options button.selected {
  border-color: #555;
}
.color-options .mdl {
  font-size: 13px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 13px;
  height: 38px;
  width: 100%;
  padding: 0 16px;
  text-align: left;
  font-size: 14px;
}
.menu-item:hover:enabled {
  background: #e5e5e5;
}
.notes-list {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  padding: 0 12px 12px;
  background: #fff;
}
.list-actions {
  display: flex;
  height: 42px;
  align-items: center;
}
.list-actions span:not(.mdl) {
  flex: 1;
}
.list-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
}
.notes-list > input {
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  border: 1px solid #999;
  border-bottom-width: 2px;
  background: #f7f7f7;
  padding: 5px 8px;
  outline: 0;
}
.notes-list > input:focus {
  border-bottom-color: #0078d7;
}
.note-cards {
  flex: 1;
  overflow: auto;
  padding-top: 12px;
}
.note-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-height: 80px;
  padding: 12px;
  margin-bottom: 10px;
  border-top: 4px solid transparent;
  text-align: left;
}
.note-card > span {
  max-height: 66px;
  overflow: hidden;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 14px;
}
.note-card time {
  text-align: right;
  font-size: 11px;
  color: #666;
}
.empty-list {
  text-align: center;
  color: #777;
}
.save-error {
  flex-shrink: 0;
  padding: 4px 10px;
  color: #a12616;
  background: #fff3e1;
  font-size: 11px;
}
.save-error button {
  text-decoration: underline;
}
</style>
