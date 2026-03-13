<template>
  <div class="ppt-app" @keydown="onKeyDown" tabindex="0" ref="appRef">
    <div class="toolbar">
      <div class="tool-group">
        <button class="tool-btn" @mousedown.prevent="createNew">新建</button>
        <button class="tool-btn save-btn" @mousedown.prevent="saveFile">保存</button>
        <button class="tool-btn play-btn" @mousedown.prevent="startPresentation">放映</button>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <button class="tool-btn" @mousedown.prevent="addSlide">+页</button>
        <button class="tool-btn" @mousedown.prevent="deleteSlide" :disabled="pres.slides.length <= 1">-页</button>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <button class="tool-btn" @mousedown.prevent="addTextBox">+文本</button>
        <button class="tool-btn" @mousedown.prevent="deleteElement" :disabled="!selectedId">-元素</button>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <button
          class="tool-btn"
          :class="{ active: selectedEl?.bold }"
          @mousedown.prevent="toggleBold"
        >
          <strong>B</strong>
        </button>
        <button
          class="tool-btn"
          :class="{ active: selectedEl?.italic }"
          @mousedown.prevent="toggleItalic"
        >
          <em>I</em>
        </button>
        <select class="tool-select" :value="selectedEl?.fontSize || 20" @change="onFontSizeChange">
          <option v-for="s in fontSizes" :key="s" :value="s">{{ s }}px</option>
        </select>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <label class="tool-btn color-wrap" title="文字颜色">
          <span class="color-label">A</span>
          <span class="color-bar" :style="{ background: textColor }"></span>
          <input type="color" class="color-pick" v-model="textColor" @input="applyTextColor" />
        </label>
        <label class="tool-btn color-wrap" title="幻灯片背景">
          <span class="color-preview" :style="{ background: currentSlide.backgroundColor }"></span>
          <input
            type="color"
            class="color-pick"
            :value="currentSlide.backgroundColor"
            @input="onSlideBgChange"
          />
        </label>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <button class="tool-btn" @mousedown.prevent="setAlign('left')" title="左对齐">
          <span class="align-icon al-left"><i></i><i></i><i></i></span>
        </button>
        <button class="tool-btn" @mousedown.prevent="setAlign('center')" title="居中">
          <span class="align-icon al-center"><i></i><i></i><i></i></span>
        </button>
        <button class="tool-btn" @mousedown.prevent="setAlign('right')" title="右对齐">
          <span class="align-icon al-right"><i></i><i></i><i></i></span>
        </button>
      </div>
    </div>

    <div class="main-area">
      <div class="slide-list">
        <div
          v-for="(slide, idx) in pres.slides"
          :key="slide.id"
          class="thumb-wrap"
          :class="{ active: curIdx === idx }"
          @click="selectSlide(idx)"
        >
          <span class="thumb-num">{{ idx + 1 }}</span>
          <div class="thumb-box">
            <div
              class="thumb-slide"
              :style="{
                width: SW + 'px',
                height: SH + 'px',
                transform: `scale(${thumbScale})`,
                background: slide.backgroundColor,
              }"
            >
              <div
                v-for="el in slide.elements"
                :key="el.id"
                class="thumb-el"
                :style="elStyle(el)"
              >
                {{ el.content }}
              </div>
            </div>
          </div>
        </div>
        <button class="add-slide-btn" @click="addSlide">+ 新幻灯片</button>
      </div>

      <div class="editor-area" ref="editorAreaRef">
        <div
          class="canvas-box"
          :style="{ width: scaledW + 'px', height: scaledH + 'px' }"
        >
          <div
            class="slide-canvas"
            ref="canvasRef"
            :style="{
              width: SW + 'px',
              height: SH + 'px',
              transform: `scale(${canvasScale})`,
              background: currentSlide.backgroundColor,
            }"
            @mousedown="onCanvasMouseDown"
          >
            <div
              v-for="el in currentSlide.elements"
              :key="el.id"
              class="slide-el"
              :class="{ selected: selectedId === el.id }"
              :style="elStyle(el)"
              :data-id="el.id"
              @mousedown.stop="onElMouseDown(el, $event)"
              @dblclick.stop="startEditing(el)"
            >
              <textarea
                v-if="editingId === el.id"
                class="el-textarea"
                v-model="editText"
                v-focus
                @blur="finishEditing(el)"
                @mousedown.stop
                @keydown.escape.prevent="finishEditing(el)"
              ></textarea>
              <div v-else class="el-text">{{ el.content }}</div>

              <template v-if="selectedId === el.id && editingId !== el.id">
                <div class="handle nw" @mousedown.stop="onResizeStart(el, 'nw', $event)"></div>
                <div class="handle ne" @mousedown.stop="onResizeStart(el, 'ne', $event)"></div>
                <div class="handle sw" @mousedown.stop="onResizeStart(el, 'sw', $event)"></div>
                <div class="handle se" @mousedown.stop="onResizeStart(el, 'se', $event)"></div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="status-bar">
      <span>幻灯片 {{ curIdx + 1 }} / {{ pres.slides.length }}</span>
    </div>

    <div
      v-if="presenting"
      class="pres-overlay"
      @click="presNext"
      @keydown="onPresKey"
      tabindex="0"
      ref="presRef"
    >
      <div
        class="pres-slide"
        :style="{
          width: SW + 'px',
          height: SH + 'px',
          transform: `scale(${presScale})`,
          background: presCurrentSlide.backgroundColor,
        }"
      >
        <div
          v-for="el in presCurrentSlide.elements"
          :key="el.id"
          class="pres-el"
          :style="elStyle(el)"
        >
          {{ el.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { System, BrowserWindow, Notify, join } from 'vtron';

const vFocus = {
  mounted: (el: HTMLElement) => {
    el.focus();
    if (el instanceof HTMLTextAreaElement) el.select();
  },
};

interface SlideElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  color: string;
  textAlign: string;
  backgroundColor: string;
}

interface Slide {
  id: string;
  backgroundColor: string;
  elements: SlideElement[];
}

interface Presentation {
  slides: Slide[];
}

const SW = 960;
const SH = 540;
const THUMB_W = 152;
const thumbScale = THUMB_W / SW;
const fontSizes = [14, 18, 20, 24, 28, 32, 40, 48, 64, 80];

let idSeq = 0;
function gid() {
  return 'e' + Date.now().toString(36) + '_' + (idSeq++);
}

const sys = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');

const appRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);
const editorAreaRef = ref<HTMLElement | null>(null);
const presRef = ref<HTMLElement | null>(null);

const filePath = ref('');
const curIdx = ref(0);
const selectedId = ref<string | null>(null);
const editingId = ref<string | null>(null);
const editText = ref('');
const textColor = ref('#333333');
const presenting = ref(false);
const presSlideIdx = ref(0);
const canvasScale = ref(0.8);

function createDefaultSlide(): Slide {
  return {
    id: gid(),
    backgroundColor: '#ffffff',
    elements: [
      {
        id: gid(),
        x: 160, y: 100, width: 640, height: 80,
        content: '点击编辑标题',
        fontSize: 40, bold: true, italic: false,
        color: '#333333', textAlign: 'center', backgroundColor: 'transparent',
      },
      {
        id: gid(),
        x: 160, y: 240, width: 640, height: 180,
        content: '点击编辑内容',
        fontSize: 20, bold: false, italic: false,
        color: '#666666', textAlign: 'center', backgroundColor: 'transparent',
      },
    ],
  };
}

const pres = reactive<Presentation>({ slides: [createDefaultSlide()] });
const currentSlide = computed(() => pres.slides[curIdx.value]);
const selectedEl = computed(() => {
  if (!selectedId.value) return null;
  return currentSlide.value.elements.find((e) => e.id === selectedId.value) || null;
});
const scaledW = computed(() => SW * canvasScale.value);
const scaledH = computed(() => SH * canvasScale.value);
const presCurrentSlide = computed(() => pres.slides[presSlideIdx.value]);
const presScale = computed(() => {
  const wScale = window.innerWidth / SW;
  const hScale = window.innerHeight / SH;
  return Math.min(wScale, hScale);
});

function elStyle(el: SlideElement): Record<string, string> {
  return {
    position: 'absolute',
    left: el.x + 'px',
    top: el.y + 'px',
    width: el.width + 'px',
    height: el.height + 'px',
    fontSize: el.fontSize + 'px',
    fontWeight: el.bold ? 'bold' : 'normal',
    fontStyle: el.italic ? 'italic' : 'normal',
    color: el.color,
    textAlign: el.textAlign,
    backgroundColor: el.backgroundColor || 'transparent',
  };
}

function toSlideCoords(e: MouseEvent) {
  const rect = canvasRef.value!.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * SW,
    y: ((e.clientY - rect.top) / rect.height) * SH,
  };
}

// --- Slide management ---

function selectSlide(idx: number) {
  if (editingId.value) finishEditingCurrent();
  curIdx.value = idx;
  selectedId.value = null;
  editingId.value = null;
}

function addSlide() {
  const slide = createDefaultSlide();
  pres.slides.splice(curIdx.value + 1, 0, slide);
  curIdx.value += 1;
  selectedId.value = null;
  editingId.value = null;
}

function deleteSlide() {
  if (pres.slides.length <= 1) return;
  pres.slides.splice(curIdx.value, 1);
  if (curIdx.value >= pres.slides.length) curIdx.value = pres.slides.length - 1;
  selectedId.value = null;
  editingId.value = null;
}

// --- Element management ---

function addTextBox() {
  const el: SlideElement = {
    id: gid(),
    x: 200, y: 200, width: 300, height: 60,
    content: '双击编辑文本',
    fontSize: 20, bold: false, italic: false,
    color: '#333333', textAlign: 'left', backgroundColor: 'transparent',
  };
  currentSlide.value.elements.push(el);
  selectedId.value = el.id;
  editingId.value = null;
}

function deleteElement() {
  if (!selectedId.value) return;
  const els = currentSlide.value.elements;
  const idx = els.findIndex((e) => e.id === selectedId.value);
  if (idx >= 0) els.splice(idx, 1);
  selectedId.value = null;
  editingId.value = null;
}

// --- Drag & resize ---

function onCanvasMouseDown() {
  selectedId.value = null;
  editingId.value = null;
}

function onElMouseDown(el: SlideElement, e: MouseEvent) {
  if (editingId.value === el.id) return;
  selectedId.value = el.id;
  editingId.value = null;

  const start = toSlideCoords(e);
  const ox = el.x, oy = el.y;

  const onMove = (ev: MouseEvent) => {
    const cur = toSlideCoords(ev);
    el.x = Math.round(Math.max(0, Math.min(SW - el.width, ox + cur.x - start.x)));
    el.y = Math.round(Math.max(0, Math.min(SH - el.height, oy + cur.y - start.y)));
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function onResizeStart(el: SlideElement, corner: string, e: MouseEvent) {
  e.preventDefault();
  const start = toSlideCoords(e);
  const ox = el.x, oy = el.y, ow = el.width, oh = el.height;

  const onMove = (ev: MouseEvent) => {
    const cur = toSlideCoords(ev);
    const dx = cur.x - start.x;
    const dy = cur.y - start.y;

    if (corner === 'se') {
      el.width = Math.max(40, Math.round(ow + dx));
      el.height = Math.max(30, Math.round(oh + dy));
    } else if (corner === 'sw') {
      const nw = Math.max(40, Math.round(ow - dx));
      el.x = ox + ow - nw;
      el.width = nw;
      el.height = Math.max(30, Math.round(oh + dy));
    } else if (corner === 'ne') {
      el.width = Math.max(40, Math.round(ow + dx));
      const nh = Math.max(30, Math.round(oh - dy));
      el.y = oy + oh - nh;
      el.height = nh;
    } else if (corner === 'nw') {
      const nw = Math.max(40, Math.round(ow - dx));
      const nh = Math.max(30, Math.round(oh - dy));
      el.x = ox + ow - nw;
      el.y = oy + oh - nh;
      el.width = nw;
      el.height = nh;
    }
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// --- Text editing ---

function startEditing(el: SlideElement) {
  selectedId.value = el.id;
  editingId.value = el.id;
  editText.value = el.content;
}

function finishEditing(el: SlideElement) {
  el.content = editText.value;
  editingId.value = null;
}

function finishEditingCurrent() {
  if (!editingId.value) return;
  const el = currentSlide.value.elements.find((e) => e.id === editingId.value);
  if (el) el.content = editText.value;
  editingId.value = null;
}

// --- Formatting ---

function toggleBold() {
  if (selectedEl.value) selectedEl.value.bold = !selectedEl.value.bold;
}

function toggleItalic() {
  if (selectedEl.value) selectedEl.value.italic = !selectedEl.value.italic;
}

function onFontSizeChange(e: Event) {
  if (selectedEl.value) selectedEl.value.fontSize = Number((e.target as HTMLSelectElement).value);
}

function applyTextColor() {
  if (selectedEl.value) selectedEl.value.color = textColor.value;
}

function setAlign(align: string) {
  if (selectedEl.value) selectedEl.value.textAlign = align;
}

function onSlideBgChange(e: Event) {
  currentSlide.value.backgroundColor = (e.target as HTMLInputElement).value;
}

// --- File I/O ---

function createNew() {
  pres.slides = [createDefaultSlide()];
  curIdx.value = 0;
  selectedId.value = null;
  editingId.value = null;
  filePath.value = '';
}

async function saveFile() {
  if (editingId.value) finishEditingCurrent();
  const data = JSON.stringify({ slides: pres.slides });
  let path = filePath.value || win?.config?.path;

  if (!path) {
    const desktop = join(sys._options.userLocation || '/C/Users', 'Desktop');
    path = join(desktop, '新建演示.vtppt');
    let c = 1;
    while (await sys.fs.exists(path)) {
      path = join(desktop, `新建演示 (${c}).vtppt`);
      c++;
    }
  }

  try {
    await sys.fs.writeFile(path, data);
    filePath.value = path;
    new Notify({ title: '保存成功', content: `已保存到 ${path}` });
  } catch {
    new Notify({ title: '保存失败', content: '文件保存出错' });
  }
}

async function loadFile(path: string) {
  try {
    const content = await sys.fs.readFile(path);
    if (content) {
      const data = JSON.parse(content);
      pres.slides = data.slides || [createDefaultSlide()];
      curIdx.value = 0;
      selectedId.value = null;
      filePath.value = path;
    }
  } catch {
    new Notify({ title: '打开失败', content: '文件格式不正确' });
  }
}

// --- Presentation ---

function startPresentation() {
  if (editingId.value) finishEditingCurrent();
  presSlideIdx.value = curIdx.value;
  presenting.value = true;
  nextTick(() => presRef.value?.focus());
}

function presNext() {
  if (presSlideIdx.value < pres.slides.length - 1) {
    presSlideIdx.value++;
  } else {
    presenting.value = false;
  }
}

function onPresKey(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case ' ':
      e.preventDefault();
      presNext();
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      if (presSlideIdx.value > 0) presSlideIdx.value--;
      break;
    case 'Escape':
      presenting.value = false;
      break;
  }
}

// --- Keyboard ---

function onKeyDown(e: KeyboardEvent) {
  if (presenting.value) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 's') {
    e.preventDefault();
    saveFile();
    return;
  }
  const target = e.target as HTMLElement;
  if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;

  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId.value && !editingId.value) {
    e.preventDefault();
    deleteElement();
  }
  if (e.key === 'Escape') {
    if (editingId.value) {
      finishEditingCurrent();
    } else {
      selectedId.value = null;
    }
  }
}

// --- Scale ---

function updateScale() {
  const container = editorAreaRef.value;
  if (!container) return;
  const pad = 48;
  const aw = container.clientWidth - pad * 2;
  const ah = container.clientHeight - pad * 2;
  canvasScale.value = Math.min(aw / SW, ah / SH, 1);
}

let resizeObs: ResizeObserver | null = null;

onMounted(async () => {
  appRef.value?.focus();
  if (editorAreaRef.value) {
    resizeObs = new ResizeObserver(updateScale);
    resizeObs.observe(editorAreaRef.value);
  }
  updateScale();
  if (win?.config?.path) {
    await loadFile(win.config.path);
  }
});

onUnmounted(() => {
  resizeObs?.disconnect();
});
</script>

<style scoped>
.ppt-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  background: #f0f0f0;
  outline: none;
  overflow: hidden;
}

/* ---- Toolbar ---- */
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
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
}

.tool-btn:hover { background: #e0e0e0; border-color: #ccc; }
.tool-btn:active { background: #d0d0d0; }
.tool-btn.active { background: #d3e3fd; border-color: #a8c7fa; }
.tool-btn:disabled { opacity: .4; cursor: default; }

.save-btn { background: #e8f0fe; color: #1a73e8; }
.save-btn:hover { background: #d3e3fd; }

.play-btn { background: #fce8e6; color: #d93025; }
.play-btn:hover { background: #f8d0cc; }

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

.color-wrap {
  position: relative;
  cursor: pointer;
  padding: 4px 6px;
  flex-direction: column;
  gap: 0;
}
.color-label { font-weight: 700; font-size: 13px; line-height: 1; }
.color-bar { width: 14px; height: 3px; border-radius: 1px; }
.color-preview { width: 14px; height: 12px; border: 1px solid #bbb; border-radius: 2px; }
.color-pick { position: absolute; width: 0; height: 0; opacity: 0; pointer-events: none; }

/* ---- Main area ---- */
.main-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ---- Slide list ---- */
.slide-list {
  width: 200px;
  flex-shrink: 0;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.thumb-wrap {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.15s;
}

.thumb-wrap:hover { background: #e8e8e8; }

.thumb-wrap.active {
  background: #d3e3fd;
}

.thumb-num {
  font-size: 11px;
  color: #888;
  min-width: 16px;
  text-align: right;
  padding-top: 2px;
  flex-shrink: 0;
}

.thumb-box {
  width: 152px;
  height: 85.5px;
  overflow: hidden;
  position: relative;
  border: 1px solid #d0d0d0;
  border-radius: 3px;
  background: #fff;
  flex-shrink: 0;
}

.thumb-wrap.active .thumb-box {
  border-color: #1a73e8;
  border-width: 2px;
}

.thumb-slide {
  transform-origin: top left;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.thumb-el {
  position: absolute;
  overflow: hidden;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.3;
}

.add-slide-btn {
  padding: 8px;
  border: 1px dashed #bbb;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: #888;
  font-size: 12px;
  transition: background 0.15s;
}
.add-slide-btn:hover { background: #e0e0e0; color: #333; }

/* ---- Editor area ---- */
.editor-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e0e0e0;
  overflow: hidden;
  position: relative;
}

.canvas-box {
  position: relative;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.18);
}

.slide-canvas {
  transform-origin: top left;
  position: relative;
  overflow: hidden;
}

.slide-el {
  position: absolute;
  cursor: move;
  border: 1px solid transparent;
  box-sizing: border-box;
  user-select: none;
  transition: border-color 0.1s;
}

.slide-el:hover {
  border-color: #a0c4ff;
}

.slide-el.selected {
  border-color: #1a73e8;
  border-width: 2px;
}

.el-text {
  width: 100%;
  height: 100%;
  padding: 4px 8px;
  box-sizing: border-box;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: hidden;
  line-height: 1.4;
  pointer-events: none;
}

.el-textarea {
  width: 100%;
  height: 100%;
  padding: 4px 8px;
  box-sizing: border-box;
  border: none;
  outline: none;
  resize: none;
  font: inherit;
  color: inherit;
  background: rgba(255, 255, 255, 0.85);
  line-height: 1.4;
  white-space: pre-wrap;
}

/* Resize handles */
.handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 2px solid #1a73e8;
  border-radius: 50%;
  z-index: 2;
}
.handle.nw { top: -5px; left: -5px; cursor: nw-resize; }
.handle.ne { top: -5px; right: -5px; cursor: ne-resize; }
.handle.sw { bottom: -5px; left: -5px; cursor: sw-resize; }
.handle.se { bottom: -5px; right: -5px; cursor: se-resize; }

/* ---- Status bar ---- */
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

/* ---- Presentation overlay ---- */
.pres-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  cursor: pointer;
}

.pres-slide {
  transform-origin: center center;
  position: relative;
  overflow: hidden;
}

.pres-el {
  position: absolute;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: hidden;
  line-height: 1.4;
  padding: 4px 8px;
  box-sizing: border-box;
}
</style>
