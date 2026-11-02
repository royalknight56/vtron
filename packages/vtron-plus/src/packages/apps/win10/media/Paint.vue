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
        ><button :disabled="historyIndex <= 0" title="撤销" aria-label="撤销" @click="undo">
          <span class="mdl">&#xE7A7;</span></button
        ><button :disabled="historyIndex >= historyLength - 1" title="重做" aria-label="重做" @click="redo">
          <span class="mdl">&#xE7A6;</span>
        </button>
      </div>
      <span>{{ title }}</span></template
    >
    <section ref="root" class="paint" tabindex="0" @keydown="keyboard" @paste="pasteEvent">
      <nav class="tabs">
        <button class="file-tab" @click="fileMenu = !fileMenu">文件</button
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
        <button @click="save()">保存(S)</button><button @click="save(true)">另存为 PNG(A)…</button
        ><button @click="download">下载 PNG</button>
        <hr />
        <button disabled>打印(P)</button><button disabled>设为桌面背景(B)</button>
        <hr />
        <button @click="win?.close()">退出(X)</button>
      </div>
      <div v-if="tab === '主页'" class="ribbon">
        <div class="group">
          <div class="controls">
            <button class="large" @click="paste">
              <img :src="pasteIcon" alt="" /><span>粘贴</span><span>⌄</span>
            </button>
            <div class="stack">
              <button disabled><span class="mdl">&#xE8C6;</span>剪切</button
              ><button @click="copy"><span class="mdl">&#xE8C8;</span>复制</button>
            </div>
          </div>
          <label>剪贴板</label>
        </div>
        <div class="group image">
          <div class="controls">
            <button class="large" disabled>
              <span class="select-icon"></span><span>选择</span><span>⌄</span>
            </button>
            <div class="stack">
              <button disabled><span class="mdl">&#xE7A8;</span>裁剪</button
              ><button disabled>重新调整大小</button
              ><button @click="rotate"><span class="mdl">&#xE7AD;</span>旋转</button>
            </div>
          </div>
          <label>图像</label>
        </div>
        <div class="group tools">
          <div class="tool-grid">
            <button
              v-for="item in toolButtons"
              :key="item.tool"
              :class="{ selected: tool === item.tool }"
              :title="item.name"
              :aria-label="item.name"
              @click="tool = item.tool"
            >
              <img :src="item.icon" alt="" />
            </button>
          </div>
          <label>工具</label>
        </div>
        <div class="group">
          <button class="large brush" :class="{ selected: tool === 'pencil' }" @click="tool = 'pencil'">
            <img :src="brushIcon" alt="" /><span>刷子</span><span>⌄</span></button
          ><label></label>
        </div>
        <div class="group shapes">
          <div class="controls">
            <div class="shape-grid">
              <button
                v-for="shape in shapes"
                :key="shape.tool"
                :class="{ selected: tool === shape.tool }"
                :title="shape.name"
                @click="tool = shape.tool"
              >
                {{ shape.symbol }}</button
              ><button
                v-for="symbol in ['⌁', '△', '◇', '▱', '⬟', '☆', '→', '↘', '♡']"
                :key="symbol"
                disabled
              >
                {{ symbol }}
              </button>
            </div>
            <div class="stack">
              <button disabled>轮廓⌄</button
              ><label class="filled"><input v-model="shapeFilled" type="checkbox" />填充</label>
            </div>
          </div>
          <label>形状</label>
        </div>
        <div class="group size">
          <button class="large" @click="widthMenu = !widthMenu">
            <span class="width-icon"><i></i><i></i><i></i><i></i></span><span>粗细</span><span>⌄</span>
          </button>
          <div v-if="widthMenu" class="width-menu">
            <button
              v-for="n in [1, 3, 5, 8]"
              :key="n"
              :class="{ selected: lineWidth === n }"
              @click="
                lineWidth = n;
                widthMenu = false;
              "
            >
              <span :style="{ height: n + 'px' }"></span>{{ n }} 像素
            </button>
          </div>
          <label></label>
        </div>
        <div class="group colors">
          <div class="controls">
            <button
              class="large color-choice"
              :class="{ selected: activeColor === 1 }"
              @click="activeColor = 1"
            >
              <i :style="{ background: foreground }"></i><span>颜色</span><span>1</span></button
            ><button
              class="large color-choice"
              :class="{ selected: activeColor === 2 }"
              @click="activeColor = 2"
            >
              <i :style="{ background: background }"></i><span>颜色</span><span>2</span>
            </button>
            <div class="palette">
              <button
                v-for="(color, index) in palette"
                :key="index"
                :style="{ background: color }"
                :aria-label="color"
                :title="color"
                @click="setColor(color)"
                @contextmenu.prevent="background = color"
              ></button
              ><button v-for="n in 10" :key="'empty' + n" disabled></button>
            </div>
            <label class="large edit-color"
              ><img :src="colorsIcon" alt="" /><span>编辑</span><span>颜色</span
              ><input
                type="color"
                :value="activeColor === 1 ? foreground : background"
                aria-label="编辑颜色"
                @input="setColor(($event.target as HTMLInputElement).value)"
            /></label>
          </div>
          <label>颜色</label>
        </div>
      </div>
      <div v-else class="ribbon view-ribbon">
        <div class="group">
          <div class="controls">
            <button class="large" @click="zoom = Math.min(400, zoom + 25)">
              <span class="mdl big">&#xE8A3;</span>放大</button
            ><button class="large" @click="zoom = Math.max(25, zoom - 25)">
              <span class="mdl big">&#xE71F;</span>缩小</button
            ><button class="large" @click="zoom = 100"><strong>100%</strong>100%</button>
          </div>
          <label>缩放</label>
        </div>
        <div class="group">
          <div class="stack">
            <label class="check"><input v-model="grid" type="checkbox" />网格线</label
            ><label class="check"><input v-model="showStatus" type="checkbox" />状态栏</label
            ><label class="check unavailable"><input type="checkbox" disabled />标尺</label>
          </div>
          <label>显示或隐藏</label>
        </div>
        <div class="group">
          <button class="large" disabled><span class="mdl big">&#xE740;</span>全屏</button><label>显示</label>
        </div>
      </div>
      <div class="workspace" @pointerdown.self="commitText">
        <div
          class="canvas-holder"
          :style="{ width: (canvasWidth * zoom) / 100 + 'px', height: (canvasHeight * zoom) / 100 + 'px' }"
        >
          <div
            class="canvas-scale"
            :class="{ grid }"
            :style="{
              width: canvasWidth + 'px',
              height: canvasHeight + 'px',
              transform: `scale(${zoom / 100})`,
            }"
          >
            <canvas
              ref="canvas"
              :class="{ grid }"
              :style="{ cursor: tool === 'text' ? 'text' : 'crosshair' }"
              @pointerdown="pointerDown"
              @pointermove="pointerMove"
              @pointerup="pointerUp"
              @pointercancel="pointerCancel"
              @contextmenu.prevent
            ></canvas
            ><textarea
              v-if="textEntry"
              ref="textInput"
              v-model="textEntry.value"
              class="text-entry"
              :style="{ left: textEntry.x + 'px', top: textEntry.y + 'px', color: foreground }"
              aria-label="输入文本"
              @keydown.ctrl.enter.stop.prevent="commitText"
              @keydown.esc.stop.prevent="textEntry = null"
              @blur="commitText"
            ></textarea>
          </div>
          <i class="handle right"></i><i class="handle bottom"></i><i class="handle corner"></i>
        </div>
      </div>
      <footer v-if="showStatus" class="status">
        <span class="position">{{ position ? `${position.x}, ${position.y}像素` : '' }}</span
        ><span class="selection"><span class="mdl">&#xE739;</span></span
        ><span class="dimensions"
          ><span class="mdl">&#xE799;</span>{{ canvasWidth }} × {{ canvasHeight }}像素</span
        ><span class="spacer"></span><button @click="zoom = 100">{{ zoom }}%</button
        ><button aria-label="缩小" @click="zoom = Math.max(25, zoom - 25)">
          <span class="mdl">&#xE738;</span></button
        ><input v-model.number="zoom" type="range" min="25" max="400" step="25" aria-label="缩放" /><button
          aria-label="放大"
          @click="zoom = Math.min(400, zoom + 25)"
        >
          <span class="mdl">&#xE710;</span>
        </button>
      </footer>
      <input
        ref="importInput"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/bmp"
        hidden
        @change="importFile"
      /><MediaPathDialog :state="prompt" @finish="finish" />
    </section>
  </Win10Frame>
</template>
<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue';
import { BrowserWindow, Dialog, System, basename } from 'vtron';
import Win10Frame from '../../daily/Win10Frame.vue';
import MediaPathDialog from './MediaPathDialog.vue';
import { canWrite, desktopPath, message, usePathPrompt, virtualMedia, virtualPath } from './mediaFiles';
import pasteIcon from './assets/paint-paste.png';
import brushIcon from './assets/paint-brush.png';
import pencilIcon from './assets/paint-pencil.png';
import fillIcon from './assets/paint-fill.png';
import textIcon from './assets/paint-text.png';
import eraserIcon from './assets/paint-eraser.png';
import pickerIcon from './assets/paint-picker.png';
import zoomIcon from './assets/paint-zoom.png';
import colorsIcon from './assets/paint-colors.png';
type Tool = 'pencil' | 'fill' | 'text' | 'eraser' | 'picker' | 'zoom' | 'line' | 'rect' | 'ellipse';
const sys = inject<System>('system')!,
  win = inject<BrowserWindow>('browserWindow');
const root = ref<HTMLElement>(),
  canvas = ref<HTMLCanvasElement>(),
  textInput = ref<HTMLTextAreaElement>(),
  importInput = ref<HTMLInputElement>();
const path = ref(''),
  busy = ref(false),
  revision = ref(0),
  savedRevision = ref(0),
  historyIndex = ref(-1),
  historyLength = ref(0);
let nextRevision = 0;
const dirty = computed(() => revision.value !== savedRevision.value);
const title = computed(
  () => `${dirty.value ? '*' : ''}${path.value ? basename(path.value) : '无标题'} - 画图`
);
watch(title, (value) => win?.setTitle(value), { immediate: true });
const tool = ref<Tool>('pencil'),
  tab = ref('主页'),
  fileMenu = ref(false),
  foreground = ref('#000000'),
  background = ref('#ffffff'),
  activeColor = ref(1),
  lineWidth = ref(3),
  widthMenu = ref(false),
  shapeFilled = ref(false),
  zoom = ref(100),
  grid = ref(false),
  showStatus = ref(true),
  canvasWidth = ref(640),
  canvasHeight = ref(400),
  position = ref<{ x: number; y: number } | null>(null);
const toolButtons: { tool: Tool; name: string; icon: string }[] = [
  { tool: 'pencil', name: '铅笔', icon: pencilIcon },
  { tool: 'fill', name: '用颜色填充', icon: fillIcon },
  { tool: 'text', name: '文本', icon: textIcon },
  { tool: 'eraser', name: '橡皮擦', icon: eraserIcon },
  { tool: 'picker', name: '颜色选取器', icon: pickerIcon },
  { tool: 'zoom', name: '放大镜', icon: zoomIcon },
];
const shapes: { tool: Tool; name: string; symbol: string }[] = [
  { tool: 'line', name: '直线', symbol: '╱' },
  { tool: 'rect', name: '矩形', symbol: '□' },
  { tool: 'ellipse', name: '椭圆', symbol: '○' },
];
const palette = [
  '#000000',
  '#7f7f7f',
  '#880015',
  '#ed1c24',
  '#ff7f27',
  '#fff200',
  '#22b14c',
  '#00a2e8',
  '#3f48cc',
  '#a349a4',
  '#ffffff',
  '#c3c3c3',
  '#b97a57',
  '#ffaec9',
  '#ffc90e',
  '#efe4b0',
  '#b5e61d',
  '#99d9ea',
  '#7092be',
  '#c8bfe7',
];
const { prompt, ask, finish } = usePathPrompt();
const textEntry = ref<{ x: number; y: number; value: string } | null>(null);
type Snapshot = { pixels: ImageData; revision: number };
let history: Snapshot[] = [],
  drawing = false,
  start = { x: 0, y: 0 },
  previous = { x: 0, y: 0 },
  before: ImageData | null = null;
function context() {
  return canvas.value?.getContext('2d', { willReadFrequently: true }) || null;
}
function setColor(value: string) {
  if (activeColor.value === 1) foreground.value = value;
  else background.value = value;
}
function pushHistory() {
  const ctx = context(),
    c = canvas.value;
  if (!ctx || !c) return;
  history = history.slice(0, historyIndex.value + 1);
  revision.value = ++nextRevision;
  history.push({ pixels: ctx.getImageData(0, 0, c.width, c.height), revision: revision.value });
  if (history.length > 12) history.shift();
  historyIndex.value = history.length - 1;
  historyLength.value = history.length;
}
function restore(index: number) {
  const item = history[index],
    c = canvas.value;
  if (!item || !c) return;
  historyIndex.value = index;
  c.width = canvasWidth.value = item.pixels.width;
  c.height = canvasHeight.value = item.pixels.height;
  context()?.putImageData(item.pixels, 0, 0);
  revision.value = item.revision;
}
function undo() {
  commitText();
  if (!busy.value && historyIndex.value > 0) restore(historyIndex.value - 1);
}
function redo() {
  commitText();
  if (!busy.value && historyIndex.value < history.length - 1) restore(historyIndex.value + 1);
}
function blank() {
  const c = canvas.value;
  if (!c) return;
  c.width = canvasWidth.value = 640;
  c.height = canvasHeight.value = 400;
  const ctx = context()!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  history = [];
  historyIndex.value = -1;
  pushHistory();
  savedRevision.value = revision.value;
  path.value = '';
  zoom.value = 100;
}
function point(event: PointerEvent) {
  const c = canvas.value!,
    rect = c.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(c.width - 1, Math.floor(((event.clientX - rect.left) * c.width) / rect.width))),
    y: Math.max(0, Math.min(c.height - 1, Math.floor(((event.clientY - rect.top) * c.height) / rect.height))),
  };
}
function drawSegment(a: { x: number; y: number }, b: { x: number; y: number }, erase = false) {
  const ctx = context()!;
  ctx.strokeStyle = erase ? background.value : foreground.value;
  ctx.lineWidth = erase ? Math.max(10, lineWidth.value * 3) : lineWidth.value;
  ctx.lineCap = erase ? 'square' : 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x + 0.01, b.y + 0.01);
  ctx.stroke();
}
async function pointerDown(event: PointerEvent) {
  if (busy.value || prompt.value || event.button !== 0) return;
  if (textEntry.value) {
    commitText();
    return;
  }
  root.value?.focus({ preventScroll: true });
  const p = point(event);
  position.value = p;
  const ctx = context()!;
  if (tool.value === 'text') {
    textEntry.value = { ...p, value: '' };
    await nextTick();
    textInput.value?.focus({ preventScroll: true });
    return;
  }
  if (tool.value === 'picker') {
    const data = ctx.getImageData(p.x, p.y, 1, 1).data;
    foreground.value =
      '#' +
      Array.from(data.slice(0, 3))
        .map((v) => v.toString(16).padStart(2, '0'))
        .join('');
    tool.value = 'pencil';
    return;
  }
  if (tool.value === 'zoom') {
    zoom.value = Math.min(400, zoom.value + 25);
    return;
  }
  if (tool.value === 'fill') {
    floodFill(p.x, p.y);
    pushHistory();
    return;
  }
  drawing = true;
  start = p;
  previous = p;
  before = ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value);
  canvas.value?.setPointerCapture(event.pointerId);
  if (tool.value === 'pencil' || tool.value === 'eraser') drawSegment(p, p, tool.value === 'eraser');
}
function drawShape(p: { x: number; y: number }) {
  const ctx = context()!;
  if (before) ctx.putImageData(before, 0, 0);
  ctx.strokeStyle = foreground.value;
  ctx.fillStyle = background.value;
  ctx.lineWidth = lineWidth.value;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  if (tool.value === 'line') {
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(p.x, p.y);
  } else if (tool.value === 'rect') ctx.rect(start.x, start.y, p.x - start.x, p.y - start.y);
  else
    ctx.ellipse(
      (start.x + p.x) / 2,
      (start.y + p.y) / 2,
      Math.abs(p.x - start.x) / 2,
      Math.abs(p.y - start.y) / 2,
      0,
      0,
      Math.PI * 2
    );
  if (shapeFilled.value && tool.value !== 'line') ctx.fill();
  ctx.stroke();
}
function pointerMove(event: PointerEvent) {
  const p = point(event);
  position.value = p;
  if (!drawing) return;
  if (tool.value === 'pencil' || tool.value === 'eraser') drawSegment(previous, p, tool.value === 'eraser');
  else drawShape(p);
  previous = p;
}
function pointerUp(event: PointerEvent) {
  if (!drawing) return;
  pointerMove(event);
  drawing = false;
  before = null;
  canvas.value?.releasePointerCapture(event.pointerId);
  pushHistory();
}
function pointerCancel() {
  if (before) context()?.putImageData(before, 0, 0);
  drawing = false;
  before = null;
}
function floodFill(x: number, y: number) {
  const ctx = context()!,
    c = canvas.value!,
    img = ctx.getImageData(0, 0, c.width, c.height),
    data = img.data,
    offset = (y * c.width + x) * 4,
    target = Array.from(data.slice(offset, offset + 4)),
    rgb = [
      parseInt(foreground.value.slice(1, 3), 16),
      parseInt(foreground.value.slice(3, 5), 16),
      parseInt(foreground.value.slice(5, 7), 16),
      255,
    ];
  if (target.every((v, i) => v === rgb[i])) return;
  const match = (i: number) => target.every((v, n) => data[i + n] === v);
  const queue = [x, y];
  while (queue.length) {
    const cy = queue.pop()!;
    let cx = queue.pop()!;
    while (cx > 0 && match((cy * c.width + cx - 1) * 4)) cx--;
    let i = (cy * c.width + cx) * 4,
      up = false,
      down = false;
    while (cx < c.width && match(i)) {
      for (let n = 0; n < 4; n++) data[i + n] = rgb[n];
      if (cy > 0) {
        if (match(i - c.width * 4)) {
          if (!up) {
            queue.push(cx, cy - 1);
            up = true;
          }
        } else up = false;
      }
      if (cy < c.height - 1) {
        if (match(i + c.width * 4)) {
          if (!down) {
            queue.push(cx, cy + 1);
            down = true;
          }
        } else down = false;
      }
      cx++;
      i += 4;
    }
  }
  ctx.putImageData(img, 0, 0);
}
function commitText() {
  const entry = textEntry.value;
  textEntry.value = null;
  if (!entry?.value) return;
  const ctx = context()!;
  ctx.fillStyle = foreground.value;
  ctx.font = '20px "Microsoft YaHei",Arial,sans-serif';
  ctx.textBaseline = 'top';
  entry.value.split('\n').forEach((line, index) => ctx.fillText(line, entry.x, entry.y + index * 25));
  pushHistory();
}
function rotate() {
  if (busy.value) return;
  commitText();
  const c = canvas.value!,
    temporary = document.createElement('canvas');
  temporary.width = c.width;
  temporary.height = c.height;
  temporary.getContext('2d')!.drawImage(c, 0, 0);
  c.width = canvasWidth.value = temporary.height;
  c.height = canvasHeight.value = temporary.width;
  const ctx = context()!;
  ctx.translate(c.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(temporary, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  pushHistory();
}
async function confirmDiscard() {
  commitText();
  if (prompt.value) {
    finish(null);
    return false;
  }
  if (busy.value) return false;
  if (!dirty.value) return true;
  const answer = await Dialog.showMessageBox({
    title: '画图',
    message: `是否将更改保存到 ${path.value ? basename(path.value) : '无标题'}？`,
    type: 'question',
    buttons: ['保存', '不保存', '取消'],
  });
  return answer.response === 0 ? save() : answer.response === 1;
}
async function createNew() {
  if (await confirmDiscard()) {
    blank();
    fileMenu.value = false;
  }
}
async function drawImageUrl(url: string, filePath = '') {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('无法读取此图片。'));
    image.src = url;
  });
  if (image.naturalWidth * image.naturalHeight > 4_000_000)
    throw new Error('图片过大，请使用不超过 400 万像素的图片。');
  const c = canvas.value!;
  c.width = canvasWidth.value = image.naturalWidth;
  c.height = canvasHeight.value = image.naturalHeight;
  context()!.drawImage(image, 0, 0);
  history = [];
  historyIndex.value = -1;
  pushHistory();
  savedRevision.value = filePath ? revision.value : -1;
  path.value = filePath;
  fileMenu.value = false;
  zoom.value = 100;
}
async function load(filePath: string) {
  const source = await virtualMedia(sys, filePath, 'image');
  try {
    await drawImageUrl(source.url, filePath);
  } finally {
    source.release();
  }
}
async function open() {
  if (!(await confirmDiscard())) return;
  const answer = await ask('打开', path.value || desktopPath(sys, '图片.png'));
  if (!answer?.trim()) return;
  busy.value = true;
  try {
    await load(virtualPath(sys, answer));
  } catch (error) {
    await message('画图', error);
  } finally {
    busy.value = false;
  }
}
async function save(asNew = false): Promise<boolean> {
  commitText();
  if (busy.value) return false;
  fileMenu.value = false;
  let destination = path.value;
  try {
    if (asNew || !destination || !/(\.png|\.vtimg)$/i.test(destination)) {
      const answer = await ask(
        '另存为',
        destination ? destination.replace(/\.[^/.]+$/, '.png') : desktopPath(sys, '无标题.png'),
        '保存'
      );
      if (!answer?.trim()) return false;
      destination = virtualPath(sys, answer);
      if (!/\.[^/]+$/.test(destination)) destination += '.png';
    }
    if (!/\.(png|vtimg)$/i.test(destination)) throw new Error('请选择 PNG 格式保存。');
    if (!(await canWrite(sys, destination, path.value, '画图'))) return false;
    busy.value = true;
    const version = revision.value,
      data = canvas.value!.toDataURL('image/png');
    if (sys.fs.writeBinaryFile && /\.png$/i.test(destination)) {
      const bytes = Uint8Array.from(atob(data.slice(data.indexOf(',') + 1)), (char) => char.charCodeAt(0));
      await sys.fs.writeBinaryFile(destination, bytes);
    } else await sys.fs.writeFile(destination, data);
    path.value = destination;
    savedRevision.value = version;
    return true;
  } catch (error) {
    await message('画图', error);
    return false;
  } finally {
    busy.value = false;
  }
}
function download() {
  commitText();
  const anchor = document.createElement('a');
  anchor.href = canvas.value!.toDataURL('image/png');
  anchor.download = (path.value ? basename(path.value).replace(/\.[^.]+$/, '') : '无标题') + '.png';
  anchor.click();
  fileMenu.value = false;
}
async function importFile(event: Event) {
  const input = event.target as HTMLInputElement,
    file = input.files?.[0];
  input.value = '';
  if (!file || !(await confirmDiscard())) return;
  const url = URL.createObjectURL(file);
  busy.value = true;
  try {
    await drawImageUrl(url);
  } catch (error) {
    await message('画图', error);
  } finally {
    URL.revokeObjectURL(url);
    busy.value = false;
  }
}
async function paste() {
  if (!(await confirmDiscard())) return;
  try {
    if (!navigator.clipboard.read) throw new Error('请使用 Ctrl+V 粘贴图片。');
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const type = item.types.find((type) => type === 'image/png');
      if (!type) continue;
      const blob = await item.getType(type),
        url = URL.createObjectURL(blob);
      try {
        await drawImageUrl(url);
      } finally {
        URL.revokeObjectURL(url);
      }
      return;
    }
    throw new Error('剪贴板中没有图片。');
  } catch (error) {
    await message('画图', error);
  }
}
async function pasteEvent(event: ClipboardEvent) {
  if ((event.target as Element).closest('textarea,input')) return;
  const file = Array.from(event.clipboardData?.items || [])
    .find((item) => item.type.startsWith('image/'))
    ?.getAsFile();
  if (!file) return;
  event.preventDefault();
  if (!(await confirmDiscard())) return;
  const url = URL.createObjectURL(file);
  try {
    await drawImageUrl(url);
  } catch (error) {
    await message('画图', error);
  } finally {
    URL.revokeObjectURL(url);
  }
}
async function copy() {
  try {
    if (!navigator.clipboard.write || typeof ClipboardItem === 'undefined')
      throw new Error('浏览器不支持复制图片。');
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.value!.toBlob(
        (value) => (value ? resolve(value) : reject(new Error('无法复制图片。'))),
        'image/png'
      )
    );
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  } catch (error) {
    await message('画图', error);
  }
}
function keyboard(event: KeyboardEvent) {
  if (prompt.value || (event.target as Element).closest('textarea,input')) return;
  if (event.ctrlKey || event.metaKey) {
    const key = event.key.toLowerCase();
    if (['s', 'o', 'n', 'z', 'y', 'p'].includes(key)) {
      event.preventDefault();
      if (key === 's') void save(event.shiftKey);
      if (key === 'o') void open();
      if (key === 'n') void createNew();
      if (key === 'z') undo();
      if (key === 'y') redo();
    }
  }
}
onMounted(async () => {
  blank();
  root.value?.focus({ preventScroll: true });
  if (typeof win?.config.path === 'string') {
    busy.value = true;
    try {
      await load(virtualPath(sys, win.config.path));
    } catch (error) {
      await message('画图', error);
    } finally {
      busy.value = false;
    }
  }
});
</script>
<style scoped>
.paint,
.paint *,
.paint *::before,
.paint *::after {
  box-sizing: border-box;
}
.paint {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  outline: 0;
  overflow: hidden;
}
button,
input {
  font:
    12px/1.3 'Segoe UI',
    'Microsoft YaHei UI',
    sans-serif;
  color: #111;
  border-radius: 0;
}
button {
  background: transparent;
  border: 1px solid transparent;
  cursor: default;
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
}
.quick button {
  width: 22px;
  height: 24px;
}
.quick .mdl {
  font-size: 13px;
  color: #8298b7;
}
.quick button:disabled .mdl {
  opacity: 0.4;
}
.tabs {
  height: 24px;
  flex-shrink: 0;
  display: flex;
  background: white;
  border-bottom: 1px solid #d9dce1;
  user-select: none;
}
.tabs > button {
  min-width: 58px;
  padding: 0 15px;
}
.tabs > button.active {
  background: #f5f6f7;
  border: 1px solid #d9dce1;
  border-bottom: 0;
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
  background: #f5f6f7;
  border-bottom: 1px solid #c2cbd6;
  padding: 3px 4px 1px;
  user-select: none;
}
.group {
  position: relative;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  border-right: 1px solid #e0e2e4;
  padding: 0 6px 17px;
}
.group > label:last-child {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 11px;
  line-height: 17px;
  color: #57606c;
  pointer-events: none;
}
.controls {
  display: flex;
  align-items: center;
  height: 66px;
  gap: 2px;
}
.large {
  height: 66px;
  min-width: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 15px;
  padding: 3px 4px;
  white-space: nowrap;
}
.large > img {
  height: 31px;
  max-width: 34px;
  object-fit: contain;
  margin-bottom: 2px;
}
.large .big {
  height: 34px;
  font-size: 28px;
  margin-top: 3px;
}
.large strong {
  height: 35px;
  padding-top: 8px;
  font-weight: 400;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-top: 2px;
}
.stack > button,
.filled {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  text-align: left;
  white-space: nowrap;
}
.stack > button .mdl {
  font-size: 12px;
  color: #7c98ba;
}
.select-icon {
  width: 30px;
  height: 25px;
  border: 1px dashed #7792aa;
  background: #fff;
  display: block;
  margin: 3px 0 6px;
}
.image {
  padding-inline: 3px;
}
.image .stack {
  width: 94px;
}
.tools {
  padding-inline: 4px;
}
.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, 23px);
  grid-template-rows: repeat(2, 28px);
  padding-top: 4px;
}
.tool-grid > button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1px;
}
.tool-grid img {
  width: 18px;
  height: 19px;
  object-fit: contain;
}
.brush {
  margin-top: 0;
  width: 44px;
}
.shape-grid {
  display: grid;
  grid-template-columns: repeat(6, 18px);
  grid-template-rows: repeat(2, 25px);
  background: #fff;
  border: 1px solid #b8c5d4;
  padding: 1px;
}
.shape-grid button {
  width: 18px;
  height: 23px;
  padding: 0;
  font:
    20px/20px Arial,
    sans-serif;
}
.shape-grid button:disabled {
  color: #b3bac3;
}
.shapes .stack {
  padding-left: 4px;
}
.filled input {
  margin: 0 3px 0 0;
}
.size {
  padding-inline: 4px;
}
.width-icon {
  height: 32px;
  width: 33px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2px 0;
}
.width-icon i {
  display: block;
  background: #455b75;
  height: 1px;
}
.width-icon i:nth-child(2) {
  height: 2px;
}
.width-icon i:nth-child(3) {
  height: 4px;
}
.width-icon i:nth-child(4) {
  height: 6px;
}
.width-menu {
  position: fixed;
  z-index: 8;
  background: white;
  border: 1px solid #aaa;
  min-width: 150px;
  margin-top: 65px;
  box-shadow: 2px 3px 5px #0002;
}
.width-menu button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 32px;
  padding: 0 8px;
}
.width-menu span {
  display: block;
  width: 65px;
  background: black;
}
.colors {
  padding-inline: 3px;
}
.color-choice {
  width: 44px;
  min-width: 44px;
}
.color-choice > i {
  display: block;
  width: 30px;
  height: 30px;
  border: 1px solid #8b949d;
  box-shadow: inset 0 0 0 2px #fff;
  margin-bottom: 3px;
}
.color-choice:not(.selected) > i {
  width: 24px;
  height: 24px;
  margin: 3px 0 6px;
}
.palette {
  display: grid;
  grid-template-columns: repeat(10, 19px);
  grid-template-rows: repeat(3, 19px);
  gap: 2px;
  padding: 2px 3px;
}
.palette > button {
  width: 19px;
  height: 19px;
  border: 1px solid #a7a9ac;
  box-shadow: inset 0 0 0 1px white;
  padding: 0;
}
.palette > button:hover {
  outline: 1px solid #56a4e5;
}
.palette > button:disabled {
  background: #f0f0f0;
  border-color: #c6c8ca;
}
.edit-color {
  position: relative;
  min-width: 43px;
  cursor: default;
}
.edit-color > input {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  padding: 0;
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
  padding: 5px 20px 22px 5px;
  background: linear-gradient(#c9d3e3, #dce5f1);
}
.unavailable {
  color: #999;
}
.canvas-holder {
  position: relative;
  background: white;
  box-shadow: 1px 1px 2px #4b60704d;
}
.canvas-scale {
  transform-origin: 0 0;
  position: relative;
}
.canvas-scale canvas {
  display: block;
  touch-action: none;
  background: white;
}
.canvas-scale.grid::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(#7772 1px, transparent 1px),
    linear-gradient(90deg, #7772 1px, transparent 1px);
  background-size: 10px 10px;
}
.text-entry {
  position: absolute;
  width: 220px;
  height: 80px;
  background: #fff9;
  border: 1px dashed #333;
  resize: both;
  outline: 0;
  font:
    20px/25px 'Microsoft YaHei',
    Arial,
    sans-serif;
  padding: 0;
}
.handle {
  position: absolute;
  width: 4px;
  height: 4px;
  border: 1px solid #aaa;
  background: #fff;
}
.handle.right {
  right: -4px;
  top: 50%;
}
.handle.bottom {
  left: 50%;
  bottom: -4px;
}
.handle.corner {
  right: -4px;
  bottom: -4px;
}
.status {
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  background: #f0f0f0;
  border-top: 1px solid #d6d6d6;
  font-size: 11px;
}
.status > span:not(.spacer) {
  height: 22px;
  display: flex;
  align-items: center;
  gap: 5px;
  border-right: 1px solid #d8d8d8;
  padding: 0 7px;
}
.status .position {
  min-width: 160px;
}
.status .selection {
  min-width: 160px;
  color: #8097b1;
}
.status .dimensions {
  min-width: 160px;
  color: #4c6074;
}
.status .spacer {
  flex: 1;
}
.status button {
  height: 22px;
  white-space: nowrap;
  padding: 0 4px;
}
.status input {
  width: 92px;
  height: 15px;
  accent-color: #0078d7;
}
.status .mdl {
  font-size: 11px;
  color: #758ca4;
}
.file-menu {
  position: absolute;
  z-index: 10;
  top: 24px;
  left: 0;
  width: 235px;
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
