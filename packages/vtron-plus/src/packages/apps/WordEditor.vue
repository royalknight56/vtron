<template>
  <div class="word-app" @keydown="onKeyDown" ref="appRef">
    <div class="toolbar">
      <div class="tool-group">
        <button class="tool-btn" @mousedown.prevent="createNew">新建</button>
        <button class="tool-btn save-btn" @mousedown.prevent="saveFile">保存</button>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <button class="tool-btn" @mousedown.prevent="exec('undo')" title="撤销">
          <span class="undo-icon"></span>
        </button>
        <button class="tool-btn" @mousedown.prevent="exec('redo')" title="重做">
          <span class="redo-icon"></span>
        </button>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <select class="tool-select" v-model="headingVal" @change="onHeadingChange" title="段落样式">
          <option value="p">正文</option>
          <option value="h1">标题 1</option>
          <option value="h2">标题 2</option>
          <option value="h3">标题 3</option>
          <option value="h4">标题 4</option>
        </select>
        <select class="tool-select" v-model="fontSizeVal" @change="onFontSizeChange" title="字号">
          <option value="1">10px</option>
          <option value="2">13px</option>
          <option value="3">16px</option>
          <option value="4">18px</option>
          <option value="5">24px</option>
          <option value="6">32px</option>
          <option value="7">48px</option>
        </select>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <button class="tool-btn" @mousedown.prevent="exec('bold')" title="加粗 Ctrl+B">
          <strong>B</strong>
        </button>
        <button class="tool-btn" @mousedown.prevent="exec('italic')" title="斜体 Ctrl+I">
          <em>I</em>
        </button>
        <button class="tool-btn" @mousedown.prevent="exec('underline')" title="下划线 Ctrl+U">
          <span style="text-decoration: underline">U</span>
        </button>
        <button class="tool-btn" @mousedown.prevent="exec('strikeThrough')" title="删除线">
          <s>S</s>
        </button>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <label class="tool-btn color-wrap" title="字体颜色">
          <span class="color-label">A</span>
          <span class="color-bar" :style="{ background: textColor }"></span>
          <input type="color" class="color-pick" v-model="textColor" @input="applyTextColor" />
        </label>
        <label class="tool-btn color-wrap" title="背景高亮">
          <span class="color-preview" :style="{ background: highlightColor }"></span>
          <input
            type="color"
            class="color-pick"
            v-model="highlightColor"
            @input="applyHighlight"
          />
        </label>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <button class="tool-btn" @mousedown.prevent="exec('insertUnorderedList')" title="无序列表">
          <span class="list-icon ul-icon"><i></i><i></i><i></i></span>
        </button>
        <button class="tool-btn" @mousedown.prevent="exec('insertOrderedList')" title="有序列表">
          <span class="list-icon ol-icon"><i>1</i><i>2</i><i>3</i></span>
        </button>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <button class="tool-btn" @mousedown.prevent="exec('justifyLeft')" title="左对齐">
          <span class="align-icon al-left"><i></i><i></i><i></i></span>
        </button>
        <button class="tool-btn" @mousedown.prevent="exec('justifyCenter')" title="居中">
          <span class="align-icon al-center"><i></i><i></i><i></i></span>
        </button>
        <button class="tool-btn" @mousedown.prevent="exec('justifyRight')" title="右对齐">
          <span class="align-icon al-right"><i></i><i></i><i></i></span>
        </button>
        <button class="tool-btn" @mousedown.prevent="exec('justifyFull')" title="两端对齐">
          <span class="align-icon al-justify"><i></i><i></i><i></i></span>
        </button>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <button class="tool-btn" @mousedown.prevent="exec('insertHorizontalRule')" title="插入分割线">
          &mdash;
        </button>
      </div>
    </div>

    <div class="editor-area">
      <div class="page-scroll">
        <div class="page">
          <div
            class="editor-content"
            contenteditable="true"
            ref="editorRef"
            @input="onInput"
            spellcheck="false"
          ></div>
        </div>
      </div>
    </div>

    <div class="status-bar">
      <span>字数: {{ charCount }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { System, BrowserWindow, Notify, join } from 'vtron';

const sys = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');

const appRef = ref<HTMLElement | null>(null);
const editorRef = ref<HTMLElement | null>(null);
const filePath = ref('');
const charCount = ref(0);
const textColor = ref('#000000');
const highlightColor = ref('#ffff00');
const headingVal = ref('p');
const fontSizeVal = ref('3');

let savedRange: Range | null = null;

function trackSelection() {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (editorRef.value?.contains(range.startContainer)) {
      savedRange = range.cloneRange();
    }
  }
}

function restoreSelection() {
  if (!savedRange) return;
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(savedRange);
}

function exec(command: string, value?: string) {
  restoreSelection();
  document.execCommand(command, false, value);
  trackSelection();
}

function onHeadingChange() {
  restoreSelection();
  document.execCommand('formatBlock', false, headingVal.value);
  editorRef.value?.focus();
}

function onFontSizeChange() {
  restoreSelection();
  document.execCommand('fontSize', false, fontSizeVal.value);
  editorRef.value?.focus();
}

function applyTextColor() {
  restoreSelection();
  document.execCommand('foreColor', false, textColor.value);
  editorRef.value?.focus();
}

function applyHighlight() {
  restoreSelection();
  document.execCommand('hiliteColor', false, highlightColor.value);
  editorRef.value?.focus();
}

function onInput() {
  const text = editorRef.value?.innerText || '';
  charCount.value = text.replace(/\s+/g, '').length;
}

function onKeyDown(e: KeyboardEvent) {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 's') {
    e.preventDefault();
    saveFile();
  }
}

function createNew() {
  if (editorRef.value) {
    editorRef.value.innerHTML = '';
  }
  filePath.value = '';
  charCount.value = 0;
  headingVal.value = 'p';
  fontSizeVal.value = '3';
  nextTick(() => editorRef.value?.focus());
}

async function saveFile() {
  const html = editorRef.value?.innerHTML || '';
  let path = filePath.value || win?.config?.path;

  if (!path) {
    const desktopPath = join(sys._options.userLocation || '/C/Users', 'Desktop');
    path = join(desktopPath, '新建文档.vtdoc');
    let counter = 1;
    while (await sys.fs.exists(path)) {
      path = join(desktopPath, `新建文档 (${counter}).vtdoc`);
      counter++;
    }
  }

  try {
    await sys.fs.writeFile(path, html);
    filePath.value = path;
    new Notify({ title: '保存成功', content: `已保存到 ${path}` });
  } catch {
    new Notify({ title: '保存失败', content: '文件保存出错' });
  }
}

async function loadFile(path: string) {
  try {
    const content = await sys.fs.readFile(path);
    if (content !== null && editorRef.value) {
      editorRef.value.innerHTML = content;
      filePath.value = path;
      onInput();
    }
  } catch {
    new Notify({ title: '打开失败', content: '无法读取文件' });
  }
}

onMounted(async () => {
  document.addEventListener('selectionchange', trackSelection);
  await nextTick();
  if (win?.config?.path) {
    await loadFile(win.config.path);
  }
  editorRef.value?.focus();
});

onUnmounted(() => {
  document.removeEventListener('selectionchange', trackSelection);
});
</script>

<style scoped>
.word-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  background: #f0f0f0;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background: #f3f3f3;
  border-bottom: 1px solid #d8d8d8;
  gap: 4px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.tool-group {
  display: flex;
  gap: 2px;
  align-items: center;
}

.tool-btn {
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: #333;
  line-height: 1.4;
  transition: background 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
}

.tool-btn:hover {
  background: #e0e0e0;
  border-color: #ccc;
}

.tool-btn:active {
  background: #d0d0d0;
}

.save-btn {
  background: #e8f0fe;
  color: #1a73e8;
}

.save-btn:hover {
  background: #d3e3fd;
}

.tool-sep {
  width: 1px;
  height: 20px;
  background: #d0d0d0;
  margin: 0 3px;
  flex-shrink: 0;
}

.tool-select {
  height: 26px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: #fff;
  font-size: 12px;
  color: #333;
  padding: 0 4px;
  cursor: pointer;
  outline: none;
}

.tool-select:hover {
  border-color: #aaa;
}

/* Undo / Redo icons */
.undo-icon,
.redo-icon {
  display: block;
  width: 14px;
  height: 14px;
  border: 2px solid #555;
  border-radius: 50%;
  border-bottom-color: transparent;
  border-right-color: transparent;
  position: relative;
}

.undo-icon {
  transform: rotate(-45deg);
}

.undo-icon::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -4px;
  border: 4px solid transparent;
  border-right-color: #555;
}

.redo-icon {
  transform: rotate(135deg);
}

.redo-icon::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -4px;
  border: 4px solid transparent;
  border-right-color: #555;
}

/* Alignment icons */
.align-icon {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 14px;
}

.align-icon i {
  height: 2px;
  background: #555;
  border-radius: 1px;
  font-style: normal;
}

.al-left i:nth-child(1) { width: 100%; }
.al-left i:nth-child(2) { width: 60%; }
.al-left i:nth-child(3) { width: 80%; }

.al-center { align-items: center; }
.al-center i:nth-child(1) { width: 100%; }
.al-center i:nth-child(2) { width: 60%; }
.al-center i:nth-child(3) { width: 80%; }

.al-right { align-items: flex-end; }
.al-right i:nth-child(1) { width: 100%; }
.al-right i:nth-child(2) { width: 60%; }
.al-right i:nth-child(3) { width: 80%; }

.al-justify i { width: 100%; }

/* List icons */
.list-icon {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 14px;
}

.list-icon i {
  display: flex;
  align-items: center;
  font-style: normal;
  font-size: 0;
  height: 3px;
}

.ul-icon i::before {
  content: '';
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #555;
  flex-shrink: 0;
  margin-right: 2px;
}

.ul-icon i::after {
  content: '';
  height: 2px;
  flex: 1;
  background: #555;
  border-radius: 1px;
}

.ol-icon i {
  font-size: 6px;
  color: #555;
  line-height: 1;
  gap: 1px;
}

.ol-icon i::after {
  content: '';
  height: 2px;
  flex: 1;
  background: #555;
  border-radius: 1px;
}

/* Color controls */
.color-wrap {
  position: relative;
  cursor: pointer;
  padding: 4px 6px;
  gap: 0;
  flex-direction: column;
}

.color-label {
  font-weight: 700;
  font-size: 13px;
  line-height: 1;
}

.color-bar {
  width: 14px;
  height: 3px;
  border-radius: 1px;
}

.color-preview {
  width: 14px;
  height: 12px;
  border: 1px solid #bbb;
  border-radius: 2px;
}

.color-pick {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

/* Editor area */
.editor-area {
  flex: 1;
  overflow: auto;
  background: #e0e0e0;
}

.page-scroll {
  display: flex;
  justify-content: center;
  padding: 24px 20px;
  min-height: 100%;
}

.page {
  background: #fff;
  width: 100%;
  max-width: 800px;
  min-height: 900px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  border-radius: 2px;
  padding: 60px 72px;
  box-sizing: border-box;
}

.editor-content {
  outline: none;
  min-height: 400px;
  font-size: 14px;
  line-height: 1.8;
  color: #333;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.editor-content:empty::before {
  content: '开始输入内容...';
  color: #bbb;
  pointer-events: none;
}

/* Status bar */
.status-bar {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  background: #f3f3f3;
  border-top: 1px solid #d8d8d8;
  flex-shrink: 0;
  font-size: 11px;
  color: #666;
  min-height: 24px;
}
</style>
