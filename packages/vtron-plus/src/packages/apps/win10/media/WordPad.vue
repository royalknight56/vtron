<template>
  <Win10Frame
    :title="title"
    :icon="win?.windowInfo.icon"
    background="#f5f6f7"
    titlebar-background="#fff"
    :before-close="confirmDiscard"
  >
    <template #title
      ><img v-if="win?.windowInfo.icon" class="caption-icon" :src="win.windowInfo.icon" alt="" />
      <div class="quick">
        <button title="保存 (Ctrl+S)" aria-label="保存" @click="save()">
          <span class="mdl">&#xE74E;</span></button
        ><button title="撤销" aria-label="撤销" @mousedown.prevent @click="exec('undo')">
          <span class="mdl">&#xE7A7;</span></button
        ><button title="重做" aria-label="重做" @mousedown.prevent @click="exec('redo')">
          <span class="mdl">&#xE7A6;</span>
        </button>
      </div>
      <span>{{ title }}</span></template
    >
    <section class="wordpad" @keydown="keyboard">
      <nav class="tabs">
        <button class="file-tab" :class="{ selected: fileMenu }" @click="fileMenu = !fileMenu">文件</button
        ><button
          v-for="item in ['主页', '查看']"
          :key="item"
          :class="{ active: tab === item && !fileMenu }"
          @click="
            tab = item;
            fileMenu = false;
          "
        >
          {{ item }}</button
        ><span></span><button disabled aria-label="帮助"><span class="mdl">&#xE897;</span></button>
      </nav>
      <div v-if="fileMenu" class="file-menu">
        <button @click="createNew">新建(N)</button><button @click="open">打开(O)…</button
        ><button @click="importInput?.click()">从本机打开…</button>
        <hr />
        <button @click="save()">保存(S)</button><button @click="save(true)">另存为(A)…</button
        ><button disabled>RTF / DOCX 文档</button>
        <hr />
        <button disabled>打印(P)</button><button disabled>页面设置(U)</button>
        <hr />
        <button @click="win?.close()">退出(X)</button>
      </div>
      <div v-if="tab === '主页'" class="ribbon" @mousedown="rememberSelection">
        <div class="group clipboard">
          <div class="controls">
            <button class="large" @mousedown.prevent @click="paste">
              <img :src="pasteIcon" alt="" /><span>粘贴</span><span class="down">⌄</span>
            </button>
            <div class="stack">
              <button @mousedown.prevent @click="copy(true)"><span class="mdl">&#xE8C6;</span>剪切</button
              ><button @mousedown.prevent @click="copy(false)"><span class="mdl">&#xE8C8;</span>复制</button>
            </div>
          </div>
          <label>剪贴板</label>
        </div>
        <div class="group font">
          <div class="stack">
            <div class="row">
              <select v-model="font" aria-label="字体" @change="exec('fontName', font)">
                <option
                  v-for="name in ['Calibri', 'Arial', '宋体', '微软雅黑', 'Consolas', 'Times New Roman']"
                  :key="name"
                >
                  {{ name }}
                </option></select
              ><select v-model="fontSize" class="font-size" aria-label="字号" @change="setFontSize">
                <option v-for="size in [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72]" :key="size">
                  {{ size }}
                </option></select
              ><button title="增大字号" @mousedown.prevent @click="changeSize(1)">A<sup>⌃</sup></button
              ><button title="减小字号" @mousedown.prevent @click="changeSize(-1)">A<sup>⌄</sup></button>
            </div>
            <div class="row">
              <button
                :class="{ selected: formats.bold }"
                title="加粗"
                @mousedown.prevent
                @click="exec('bold')"
              >
                <b>B</b></button
              ><button
                :class="{ selected: formats.italic }"
                title="斜体"
                @mousedown.prevent
                @click="exec('italic')"
              >
                <i>I</i></button
              ><button
                :class="{ selected: formats.underline }"
                title="下划线"
                @mousedown.prevent
                @click="exec('underline')"
              >
                <u>U</u></button
              ><button title="删除线" @mousedown.prevent @click="exec('strikeThrough')"><s>abc</s></button
              ><button title="下标" @mousedown.prevent @click="exec('subscript')">x₂</button
              ><button title="上标" @mousedown.prevent @click="exec('superscript')">x²</button
              ><label class="color" title="文本颜色"
                ><span :style="{ borderBottomColor: color }">A</span
                ><input
                  v-model="color"
                  type="color"
                  aria-label="文本颜色"
                  @input="exec('foreColor', color)" /></label
              ><label class="color" title="突出显示"
                ><span class="mdl">&#xE7E6;</span
                ><input
                  v-model="highlight"
                  type="color"
                  aria-label="突出显示"
                  @input="exec('hiliteColor', highlight)"
              /></label>
            </div>
          </div>
          <label>字体</label>
        </div>
        <div class="group paragraph">
          <div class="stack">
            <div class="row">
              <button title="减少缩进" @mousedown.prevent @click="exec('outdent')">
                <img class="small-icon" :src="outdentIcon" alt="" /></button
              ><button title="增加缩进" @mousedown.prevent @click="exec('indent')">
                <img class="small-icon" :src="indentIcon" alt="" /></button
              ><button title="项目符号" @mousedown.prevent @click="exec('insertUnorderedList')">
                <span class="mdl">&#xE8FD;</span></button
              ><button disabled title="行距">↕</button>
            </div>
            <div class="row">
              <button
                v-for="(name, command) in alignments"
                :key="command"
                :title="name"
                @mousedown.prevent
                @click="exec(command)"
              >
                <img v-if="command === 'justifyFull'" class="small-icon" :src="justifyIcon" alt="" /><span
                  v-else
                  class="mdl"
                  >{{ alignmentIcons[command] }}</span
                >
              </button>
            </div>
          </div>
          <label>段落</label>
        </div>
        <div class="group insert">
          <div class="controls">
            <button class="large" @click="imageInput?.click()">
              <img :src="pictureIcon" alt="" /><span>图片</span><span class="down">⌄</span></button
            ><button class="large" disabled>
              <img :src="paintIcon" alt="" /><span>画图</span><span>绘图</span></button
            ><button
              class="large"
              @mousedown.prevent
              @click="exec('insertText', new Date().toLocaleString('zh-CN'))"
            >
              <img :src="dateIcon" alt="" /><span>日期和</span><span>时间</span></button
            ><button class="large" disabled>
              <img :src="objectIcon" alt="" /><span>插入</span><span>对象</span>
            </button>
          </div>
          <label>插入</label>
        </div>
        <div class="group editing">
          <div class="stack">
            <button @click="findText"><span class="mdl">&#xE721;</span>查找</button
            ><button disabled><span class="mdl">&#xE8AC;</span>替换</button
            ><button @mousedown.prevent @click="selectAll"><span class="mdl">&#xE8B3;</span>全选</button>
          </div>
          <label>编辑</label>
        </div>
      </div>
      <div v-else class="ribbon view-ribbon">
        <div class="group">
          <div class="controls">
            <button class="large" @click="zoom = Math.min(200, zoom + 10)">
              <span class="mdl big">&#xE8A3;</span>放大</button
            ><button class="large" @click="zoom = Math.max(50, zoom - 10)">
              <span class="mdl big">&#xE71F;</span>缩小</button
            ><button class="large" @click="zoom = 100"><strong>100%</strong>100%</button>
          </div>
          <label>缩放</label>
        </div>
        <div class="group">
          <div class="stack">
            <label class="check"><input v-model="ruler" type="checkbox" />标尺</label
            ><label class="check"><input v-model="status" type="checkbox" />状态栏</label>
          </div>
          <label>显示或隐藏</label>
        </div>
        <div class="group">
          <div class="stack"><button disabled>自动换行</button><button disabled>度量单位</button></div>
          <label>设置</label>
        </div>
      </div>
      <div class="workspace">
        <div class="page-holder" :style="{ width: (816 * zoom) / 100 + 'px' }">
          <div v-if="ruler" class="ruler" :style="{ zoom: zoom / 100 }">
            <span v-for="n in 8" :key="n">{{ n === 1 ? '' : n - 1 }}</span>
          </div>
          <article class="page" :style="{ zoom: zoom / 100 }">
            <div
              ref="editor"
              class="document"
              contenteditable="true"
              spellcheck="false"
              @input="changed"
              @keyup="trackSelection"
              @mouseup="trackSelection"
              @paste="pasteEvent"
              @drop.prevent
              @click="preventLink"
            ></div>
          </article>
        </div>
      </div>
      <footer v-if="status" class="status">
        <span></span><button @click="zoom = 100">{{ zoom }}%</button
        ><button aria-label="缩小" @click="zoom = Math.max(50, zoom - 10)">
          <span class="mdl">&#xE738;</span></button
        ><input v-model.number="zoom" type="range" min="50" max="200" step="10" aria-label="缩放" /><button
          aria-label="放大"
          @click="zoom = Math.min(200, zoom + 10)"
        >
          <span class="mdl">&#xE710;</span>
        </button>
      </footer>
      <input ref="importInput" type="file" accept=".html,.htm,.txt" hidden @change="importFile" /><input
        ref="imageInput"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        hidden
        @change="insertImage"
      /><MediaPathDialog :state="prompt" @finish="finish" />
    </section>
  </Win10Frame>
</template>
<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue';
import { BrowserWindow, Dialog, System, basename } from 'vtron';
import Win10Frame from '../../daily/Win10Frame.vue';
import { wordEscape, wordSanitize } from '../../office/wordFormats';
import MediaPathDialog from './MediaPathDialog.vue';
import { canWrite, desktopPath, message, textContent, usePathPrompt, virtualPath } from './mediaFiles';
import pasteIcon from './assets/wordpad-paste.png';
import pictureIcon from './assets/wordpad-picture.png';
import paintIcon from './assets/wordpad-paint.png';
import dateIcon from './assets/wordpad-date.png';
import objectIcon from './assets/wordpad-object.png';
import outdentIcon from './assets/wordpad-outdent.png';
import indentIcon from './assets/wordpad-indent.png';
import justifyIcon from './assets/wordpad-justify.png';
const sys = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');
const editor = ref<HTMLElement>();
const importInput = ref<HTMLInputElement>();
const imageInput = ref<HTMLInputElement>();
const path = ref(''),
  html = ref('<p><br></p>'),
  baseline = ref(html.value),
  busy = ref(false);
const dirty = computed(() => html.value !== baseline.value);
const title = computed(
  () => `${dirty.value ? '*' : ''}${path.value ? basename(path.value) : '文档'} - 写字板`
);
watch(title, (value) => win?.setTitle(value), { immediate: true });
const tab = ref('主页'),
  fileMenu = ref(false),
  font = ref('Calibri'),
  fontSize = ref(11),
  color = ref('#000000'),
  highlight = ref('#ffff00'),
  zoom = ref(100),
  ruler = ref(true),
  status = ref(true);
const formats = ref({ bold: false, italic: false, underline: false });
const alignments = {
  justifyLeft: '左对齐',
  justifyCenter: '居中',
  justifyRight: '右对齐',
  justifyFull: '两端对齐',
};
const alignmentIcons = {
  justifyLeft: '\uE8E4',
  justifyCenter: '\uE8E3',
  justifyRight: '\uE8E2',
  justifyFull: '',
};
const { prompt, ask, finish } = usePathPrompt();
let selection: Range | null = null;
function rememberSelection() {
  const current = document.getSelection();
  if (current?.rangeCount && editor.value?.contains(current.anchorNode))
    selection = current.getRangeAt(0).cloneRange();
}
function trackSelection() {
  rememberSelection();
  formats.value = {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
  };
}
function restoreSelection() {
  editor.value?.focus({ preventScroll: true });
  if (selection && editor.value?.contains(selection.startContainer)) {
    const current = document.getSelection();
    current?.removeAllRanges();
    current?.addRange(selection);
  }
}
function changed() {
  html.value = editor.value?.innerHTML || '';
  trackSelection();
}
function exec(command: string, value?: string) {
  if (!editor.value) return;
  restoreSelection();
  document.execCommand(command, false, value);
  changed();
}
function setFontSize() {
  restoreSelection();
  document.execCommand('fontSize', false, '7');
  editor.value?.querySelectorAll('font[size="7"]').forEach((node) => {
    node.removeAttribute('size');
    (node as HTMLElement).style.fontSize = fontSize.value + 'pt';
  });
  changed();
}
function changeSize(direction: number) {
  fontSize.value = Math.max(8, Math.min(72, Number(fontSize.value) + direction));
  setFontSize();
}
function selectAll() {
  editor.value?.focus({ preventScroll: true });
  const range = document.createRange();
  range.selectNodeContents(editor.value!);
  const current = document.getSelection();
  current?.removeAllRanges();
  current?.addRange(range);
  trackSelection();
}
async function copy(cut: boolean) {
  restoreSelection();
  if (document.execCommand(cut ? 'cut' : 'copy')) {
    if (cut) changed();
    return;
  }
  try {
    await navigator.clipboard.writeText(document.getSelection()?.toString() || '');
    if (cut) exec('delete');
  } catch {
    await message('写字板', '请使用 Ctrl+C / Ctrl+X 访问剪贴板。');
  }
}
async function paste() {
  try {
    const value = await navigator.clipboard.readText();
    exec('insertText', value);
  } catch {
    await message('写字板', '请使用 Ctrl+V 粘贴。');
  }
}
function pasteEvent(event: ClipboardEvent) {
  event.preventDefault();
  const html = event.clipboardData?.getData('text/html');
  exec(
    html ? 'insertHTML' : 'insertText',
    html ? wordSanitize(html) : event.clipboardData?.getData('text/plain') || ''
  );
}
function preventLink(event: MouseEvent) {
  if ((event.target as Element).closest('a')) event.preventDefault();
}
async function setDocument(value: string, filePath = '') {
  html.value = value || '<p><br></p>';
  baseline.value = html.value;
  path.value = filePath;
  selection = null;
  await nextTick();
  if (editor.value) editor.value.innerHTML = html.value;
  fileMenu.value = false;
  editor.value?.focus({ preventScroll: true });
}
async function confirmDiscard() {
  if (prompt.value) {
    finish(null);
    return false;
  }
  if (busy.value) return false;
  if (!dirty.value) return true;
  const answer = await Dialog.showMessageBox({
    title: '写字板',
    message: `是否将更改保存到 ${path.value ? basename(path.value) : '文档'}？`,
    type: 'question',
    buttons: ['保存', '不保存', '取消'],
  });
  return answer.response === 0 ? save() : answer.response === 1;
}
async function createNew() {
  if (await confirmDiscard()) await setDocument('<p><br></p>');
}
async function load(filePath: string) {
  if (!/\.(html?|txt)$/i.test(filePath)) throw new Error('支持 HTML 和 TXT 文档；RTF、DOCX 暂不可用。');
  const value = await sys.fs.readFile(filePath);
  if (value === null) throw new Error('找不到文档。');
  const text = textContent(value);
  await setDocument(
    /\.txt$/i.test(filePath) ? `<p>${wordEscape(text).replace(/\r?\n/g, '<br>')}</p>` : wordSanitize(text),
    filePath
  );
}
async function open() {
  if (!(await confirmDiscard())) return;
  const answer = await ask('打开', path.value || desktopPath(sys, '文档.html'));
  if (!answer?.trim()) return;
  busy.value = true;
  try {
    await load(virtualPath(sys, answer));
  } catch (error) {
    await message('写字板', error);
  } finally {
    busy.value = false;
  }
}
async function save(asNew = false): Promise<boolean> {
  if (busy.value) return false;
  fileMenu.value = false;
  let destination = path.value;
  try {
    if (asNew || !destination) {
      const answer = await ask('另存为', destination || desktopPath(sys, '文档.html'), '保存');
      if (!answer?.trim()) return false;
      destination = virtualPath(sys, answer);
      if (!/\.[^/]+$/.test(destination)) destination += '.html';
    }
    if (!/\.(html?|txt)$/i.test(destination)) throw new Error('请选择 .html 或 .txt 格式保存。');
    if (!(await canWrite(sys, destination, path.value, '写字板'))) return false;
    if (/\.txt$/i.test(destination) && /<(?:b|strong|i|em|u|font|img|span)\b/i.test(html.value)) {
      const result = await Dialog.showMessageBox({
        title: '写字板',
        message: '保存为纯文本将丢失格式。是否继续？',
        type: 'warning',
        buttons: ['保存', '取消'],
      });
      if (result.response !== 0) return false;
    }
    busy.value = true;
    const snapshot = html.value;
    await sys.fs.writeFile(
      destination,
      /\.txt$/i.test(destination)
        ? editor.value?.innerText || ''
        : `<!doctype html><meta charset="utf-8"><body>${wordSanitize(snapshot)}</body>`
    );
    path.value = destination;
    baseline.value = snapshot;
    return true;
  } catch (error) {
    await message('写字板', error);
    return false;
  } finally {
    busy.value = false;
  }
}
async function importFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || !(await confirmDiscard())) return;
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error('文档过大。');
    if (!/\.(html?|txt)$/i.test(file.name)) throw new Error('请选择 HTML 或 TXT 文档。');
    const value = await file.text();
    await setDocument(
      /\.txt$/i.test(file.name)
        ? `<p>${wordEscape(value).replace(/\r?\n/g, '<br>')}</p>`
        : wordSanitize(value)
    );
    baseline.value = '';
  } catch (error) {
    await message('写字板', error);
  }
}
async function insertImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error('图片过大。');
    if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) throw new Error('不支持此图片格式。');
    const reader = new FileReader();
    reader.onload = () =>
      exec('insertHTML', `<img src="${reader.result}" alt="图片" style="max-width:100%">`);
    reader.readAsDataURL(file);
  } catch (error) {
    await message('写字板', error);
  }
}
async function findText() {
  rememberSelection();
  const answer = await ask('查找', '');
  if (!answer) return;
  const root = editor.value;
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const offset = node.textContent?.indexOf(answer) ?? -1;
    if (offset >= 0) {
      const range = document.createRange();
      range.setStart(node, offset);
      range.setEnd(node, offset + answer.length);
      selection = range;
      restoreSelection();
      node.parentElement?.scrollIntoView({ block: 'nearest' });
      return;
    }
  }
  await message('写字板', `找不到“${answer}”。`);
}
function keyboard(event: KeyboardEvent) {
  if (prompt.value) return;
  if (event.ctrlKey || event.metaKey) {
    const key = event.key.toLowerCase();
    if (['s', 'o', 'n', 'p', 'f'].includes(key)) {
      event.preventDefault();
      if (key === 's') void save(event.shiftKey);
      if (key === 'o') void open();
      if (key === 'n') void createNew();
      if (key === 'f') void findText();
    }
  }
}
onMounted(async () => {
  await setDocument('<p><br></p>');
  if (typeof win?.config.path === 'string') {
    try {
      await load(virtualPath(sys, win.config.path));
    } catch (error) {
      await message('写字板', error);
    }
  }
});
</script>
<style scoped>
.wordpad,
.wordpad *,
.wordpad *::before,
.wordpad *::after {
  box-sizing: border-box;
}
.wordpad {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  color: #111;
  background: #f5f6f7;
  overflow: hidden;
}
button,
input,
select {
  font:
    12px/1.3 'Segoe UI',
    'Microsoft YaHei UI',
    sans-serif;
  border-radius: 0;
  color: #111;
}
button {
  cursor: default;
  border: 1px solid transparent;
  background: transparent;
  padding: 2px 4px;
}
button:hover:enabled,
button.selected {
  background: #e5f3ff;
  border-color: #a4cef9;
}
button:disabled {
  color: #999;
}
button:disabled img {
  opacity: 0.45;
}
button:focus-visible {
  outline: 1px dotted #555;
  outline-offset: -3px;
}
.mdl {
  font: 14px/1 'SEGOEUIMDL';
}
.caption-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}
.quick {
  display: flex;
  border-left: 1px solid #ccc;
  border-right: 1px solid #ccc;
  padding: 0 3px;
  gap: 1px;
}
.quick button {
  width: 22px;
  height: 24px;
}
.quick button .mdl {
  font-size: 13px;
  color: #8298b7;
}
.tabs {
  display: flex;
  height: 24px;
  flex-shrink: 0;
  background: white;
  border-bottom: 1px solid #d9dce1;
  align-items: stretch;
  user-select: none;
}
.tabs > button {
  min-width: 58px;
  padding: 0 15px;
  border-bottom: 0;
}
.tabs > button.active {
  border: 1px solid #dadde1;
  border-bottom: 1px solid #f5f6f7;
  background: #f5f6f7;
}
.tabs .file-tab {
  background: #1979c9;
  color: white;
  min-width: 56px;
}
.tabs > span {
  flex: 1;
}
.tabs > button:last-child {
  min-width: 26px;
  padding: 0 6px;
}
.ribbon {
  height: 91px;
  flex-shrink: 0;
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid #c2cbd6;
  background: #f5f6f7;
  padding: 3px 4px 1px;
  user-select: none;
}
.group {
  position: relative;
  flex-shrink: 0;
  padding: 0 7px 17px;
  border-right: 1px solid #e0e2e4;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-width: 0;
}
.group > label:last-child {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  color: #57606c;
  font-size: 11px;
  line-height: 17px;
  pointer-events: none;
}
.controls,
.row {
  display: flex;
  align-items: center;
  gap: 1px;
}
.controls {
  height: 66px;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 5px;
}
.stack > button {
  text-align: left;
  display: flex;
  align-items: center;
  gap: 5px;
  height: 20px;
  white-space: nowrap;
}
.row {
  height: 25px;
}
.row > button {
  height: 23px;
  min-width: 23px;
  padding: 1px 3px;
}
.large {
  height: 67px;
  min-width: 45px;
  display: flex;
  align-items: center;
  flex-direction: column;
  line-height: 15px;
  padding: 3px 4px;
  white-space: nowrap;
}
.large img {
  height: 31px;
  max-width: 33px;
  object-fit: contain;
  margin-bottom: 3px;
}
.large .down {
  font-size: 12px;
  line-height: 10px;
}
.large .big {
  font-size: 28px;
  height: 35px;
  margin-top: 3px;
}
.large strong {
  height: 35px;
  padding-top: 8px;
  font-weight: 400;
}
.clipboard {
  padding-left: 4px;
}
.clipboard .stack button {
  color: #6e7a8c;
}
.font {
  width: 222px;
}
.font select {
  height: 22px;
  border: 1px solid #aebdcc;
  background: white;
  padding: 0 3px;
  width: 121px;
}
.font select.font-size {
  width: 44px;
}
.font .row > button {
  min-width: 22px;
}
.font .row sup {
  font-size: 8px;
}
.color {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  height: 23px;
}
.color > span:not(.mdl) {
  font: 700 15px Georgia;
  border-bottom: 3px solid black;
  line-height: 16px;
}
.color > input {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
}
.small-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.paragraph {
  width: 130px;
}
.paragraph .row {
  gap: 1px;
}
.paragraph button {
  width: 26px;
}
.insert {
  padding: 0 4px 17px;
}
.insert .large {
  min-width: 44px;
  padding-inline: 3px;
}
.editing .stack {
  padding-top: 0;
  gap: 0;
}
.editing .stack > button {
  height: 22px;
}
.view-ribbon .group {
  padding-inline: 12px;
}
.check {
  display: flex;
  align-items: center;
  height: 22px;
  white-space: nowrap;
}
.check input {
  margin: 0 5px 0 0;
}
.workspace {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: linear-gradient(#c6d0e1, #dae3ef);
  padding: 0 18px 30px;
}
.page-holder {
  margin: 0 auto;
  min-width: 0;
}
.ruler {
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 23px;
  color: #253961;
  background: linear-gradient(transparent 6px, #f3f3f3 6px, #f3f3f3 21px, transparent 21px);
  position: relative;
  font-size: 11px;
  user-select: none;
}
.ruler::after {
  content: '';
  position: absolute;
  inset: 14px 24px auto;
  height: 6px;
  background: repeating-linear-gradient(90deg, transparent 0, transparent 11px, #8b94a1 11px, #8b94a1 12px);
}
.ruler span {
  z-index: 1;
  background: #f3f3f3;
  min-width: 12px;
  text-align: center;
}
.page {
  width: 816px;
  min-height: 1056px;
  padding: 96px;
  background: white;
  box-shadow: 0 0 5px #67758b8c;
  color: black;
}
.document {
  outline: 0;
  min-height: 864px;
  font:
    11pt/1.4 Calibri,
    '宋体',
    sans-serif;
  white-space: normal;
  overflow-wrap: anywhere;
}
.document:deep(p) {
  margin: 0 0 8pt;
}
.document:deep(img) {
  max-width: 100%;
}
.status {
  height: 26px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  background: #f0f0f0;
  border-top: 1px solid #d6d6d6;
  padding: 0 12px;
  gap: 3px;
}
.status > span {
  flex: 1;
}
.status button {
  height: 22px;
  padding: 0 3px;
}
.status .mdl {
  font-size: 11px;
  color: #666;
}
.status input {
  width: 90px;
  height: 15px;
  accent-color: #0078d7;
}
.file-menu {
  position: absolute;
  z-index: 10;
  top: 24px;
  left: 0;
  width: 230px;
  background: #fff;
  border: 1px solid #8ca6bf;
  box-shadow: 2px 3px 6px #0003;
  padding: 7px;
}
.file-menu button {
  display: block;
  width: 100%;
  height: 32px;
  padding-left: 24px;
  text-align: left;
}
.file-menu hr {
  border: 0;
  border-top: 1px solid #ddd;
  margin: 4px 0;
}
</style>
