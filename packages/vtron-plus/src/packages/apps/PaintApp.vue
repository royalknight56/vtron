<template>
  <div class="paint-app" @keydown="onKeyDown" tabindex="0" ref="appRef">
    <div class="toolbar">
      <div class="tool-group">
        <button class="tool-btn text-btn" @mousedown.prevent="createNew" title="新建(Ctrl+N)">新建</button>
        <button class="tool-btn text-btn" @mousedown.prevent="saveFile" title="保存(Ctrl+S)">保存</button>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <button
          class="tool-btn"
          :class="{ active: tool === 'pencil' }"
          @mousedown.prevent="tool = 'pencil'"
          title="画笔(P)"
        >
          <svg viewBox="0 0 20 20" class="tb-ico">
            <path
              d="M14 3l3 3L7 16l-4 1 1-4L14 3z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          class="tool-btn"
          :class="{ active: tool === 'eraser' }"
          @mousedown.prevent="tool = 'eraser'"
          title="橡皮(E)"
        >
          <svg viewBox="0 0 20 20" class="tb-ico">
            <rect
              x="3"
              y="8"
              width="14"
              height="6"
              rx="1"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              transform="rotate(-15 10 11)"
            />
            <line x1="3" y1="17" x2="17" y2="17" stroke="currentColor" stroke-width="1.5" />
          </svg>
        </button>
        <button
          class="tool-btn"
          :class="{ active: tool === 'line' }"
          @mousedown.prevent="tool = 'line'"
          title="直线(L)"
        >
          <svg viewBox="0 0 20 20" class="tb-ico">
            <line
              x1="3"
              y1="17"
              x2="17"
              y2="3"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <button
          class="tool-btn"
          :class="{ active: tool === 'rect' }"
          @mousedown.prevent="tool = 'rect'"
          title="矩形(R)"
        >
          <svg viewBox="0 0 20 20" class="tb-ico">
            <rect
              x="3"
              y="5"
              width="14"
              height="10"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            />
          </svg>
        </button>
        <button
          class="tool-btn"
          :class="{ active: tool === 'ellipse' }"
          @mousedown.prevent="tool = 'ellipse'"
          title="椭圆(O)"
        >
          <svg viewBox="0 0 20 20" class="tb-ico">
            <ellipse
              cx="10"
              cy="10"
              rx="7"
              ry="5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            />
          </svg>
        </button>
        <button
          class="tool-btn"
          :class="{ active: tool === 'text' }"
          @mousedown.prevent="tool = 'text'"
          title="文字(T)"
        >
          <span class="tb-text">T</span>
        </button>
        <button
          class="tool-btn"
          :class="{ active: tool === 'fill' }"
          @mousedown.prevent="tool = 'fill'"
          title="填充(F)"
        >
          <svg viewBox="0 0 20 20" class="tb-ico">
            <path d="M6 16l4-12 4 12H6z" fill="currentColor" opacity="0.7" />
            <rect x="4" y="17" width="12" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <label class="color-label" title="前景色">
          <span class="color-dot" :style="{ background: fgColor }"></span>
          <input type="color" v-model="fgColor" class="sr-only-color" />
        </label>
        <label class="color-label" title="背景色">
          <span class="color-dot bg-style" :style="{ background: bgColor }"></span>
          <input type="color" v-model="bgColor" class="sr-only-color" />
        </label>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group size-g">
        <span class="size-num">{{ lineWidth }}px</span>
        <input
          type="range"
          v-model.number="lineWidth"
          min="1"
          max="50"
          class="size-range"
        />
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <label class="check-label">
          <input type="checkbox" v-model="shapeFilled" />
          <span>填充</span>
        </label>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <button
          class="tool-btn"
          @mousedown.prevent="undo"
          :disabled="!canUndo"
          title="撤销(Ctrl+Z)"
        >
          ↩
        </button>
        <button
          class="tool-btn"
          @mousedown.prevent="redo"
          :disabled="!canRedo"
          title="重做(Ctrl+Y)"
        >
          ↪
        </button>
        <button class="tool-btn text-btn" @mousedown.prevent="clearCanvas" title="清空画布">
          清空
        </button>
      </div>
    </div>

    <div class="palette-row">
      <span
        v-for="c in palette"
        :key="c"
        class="pal-swatch"
        :class="{ sel: fgColor === c }"
        :style="{ background: c }"
        @click="fgColor = c"
        @contextmenu.prevent="bgColor = c"
      ></span>
    </div>

    <div class="canvas-area" ref="areaRef">
      <div class="canvas-wrap" :style="{ width: canvasW + 'px', height: canvasH + 'px' }">
        <canvas
          ref="canvasRef"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseLeave"
          :style="{ cursor: cursorStyle }"
        ></canvas>
        <textarea
          v-if="textState.show"
          ref="textInputRef"
          class="text-overlay"
          :style="textStyle"
          v-model="textState.value"
          @blur="commitText"
          @keydown.escape.prevent="cancelText"
        ></textarea>
      </div>
    </div>

    <div class="status-bar">
      <span>{{ canvasW }} × {{ canvasH }}</span>
      <span v-if="mousePos">{{ mousePos.x }}, {{ mousePos.y }}</span>
      <span class="sb-right">{{ toolLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, reactive, computed, onMounted, nextTick } from 'vue';
import { System, BrowserWindow, Notify, join } from 'vtron';

type ToolType = 'pencil' | 'eraser' | 'line' | 'rect' | 'ellipse' | 'text' | 'fill';

const sys = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');

const appRef = ref<HTMLDivElement>();
const areaRef = ref<HTMLDivElement>();
const canvasRef = ref<HTMLCanvasElement>();
const textInputRef = ref<HTMLTextAreaElement>();

const tool = ref<ToolType>('pencil');
const fgColor = ref('#000000');
const bgColor = ref('#ffffff');
const lineWidth = ref(3);
const shapeFilled = ref(false);
const canvasW = ref(800);
const canvasH = ref(600);
const mousePos = ref<{ x: number; y: number } | null>(null);
const filePath = ref('');

let drawing = false;
let startX = 0;
let startY = 0;
let snapshotBeforeShape: ImageData | null = null;

const textState = reactive({ show: false, x: 0, y: 0, cx: 0, cy: 0, value: '' });

let historyStack: ImageData[] = [];
const historyIdx = ref(-1);
const historyLen = ref(0);
const MAX_HISTORY = 30;

const canUndo = computed(() => historyIdx.value > 0);
const canRedo = computed(() => historyIdx.value < historyLen.value - 1);

const palette = [
  '#000000', '#808080', '#800000', '#ff0000', '#ff8000', '#ffff00',
  '#008000', '#00ff00', '#008080', '#00ffff', '#000080', '#0000ff',
  '#800080', '#ff00ff', '#ffffff', '#c0c0c0', '#ff8080', '#80ff80',
  '#8080ff', '#ffff80', '#80ffff', '#ff80ff', '#804000', '#ffc080',
];

const toolLabels: Record<ToolType, string> = {
  pencil: '画笔',
  eraser: '橡皮',
  line: '直线',
  rect: '矩形',
  ellipse: '椭圆',
  text: '文字',
  fill: '填充',
};

const toolLabel = computed(() => toolLabels[tool.value]);
const cursorStyle = computed(() => (tool.value === 'text' ? 'text' : 'crosshair'));

const textStyle = computed(() => ({
  left: textState.x + 'px',
  top: textState.y + 'px',
  color: fgColor.value,
  fontSize: Math.max(lineWidth.value * 3, 14) + 'px',
}));

function getCtx() {
  return canvasRef.value?.getContext('2d', { willReadFrequently: true }) ?? null;
}

function getCanvasPos(e: MouseEvent) {
  const c = canvasRef.value;
  if (!c) return { x: 0, y: 0 };
  const r = c.getBoundingClientRect();
  return {
    x: Math.round(((e.clientX - r.left) * c.width) / r.width),
    y: Math.round(((e.clientY - r.top) * c.height) / r.height),
  };
}

function pushHistory() {
  const g = getCtx();
  const c = canvasRef.value;
  if (!g || !c) return;
  if (historyIdx.value < historyStack.length - 1) {
    historyStack.splice(historyIdx.value + 1);
  }
  historyStack.push(g.getImageData(0, 0, c.width, c.height));
  if (historyStack.length > MAX_HISTORY) historyStack.shift();
  historyIdx.value = historyStack.length - 1;
  historyLen.value = historyStack.length;
}

function undo() {
  if (!canUndo.value) return;
  historyIdx.value--;
  getCtx()?.putImageData(historyStack[historyIdx.value], 0, 0);
}

function redo() {
  if (!canRedo.value) return;
  historyIdx.value++;
  getCtx()?.putImageData(historyStack[historyIdx.value], 0, 0);
}

function initCanvas(w: number, h: number) {
  const c = canvasRef.value;
  const g = getCtx();
  if (!c || !g) return;
  c.width = w;
  c.height = h;
  canvasW.value = w;
  canvasH.value = h;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, h);
  historyStack = [];
  historyIdx.value = -1;
  historyLen.value = 0;
  pushHistory();
}

function onMouseDown(e: MouseEvent) {
  if (textState.show) return;
  const p = getCanvasPos(e);
  const g = getCtx();
  if (!g) return;

  if (tool.value === 'text') {
    textState.show = true;
    textState.x = p.x;
    textState.y = p.y;
    textState.cx = p.x;
    textState.cy = p.y;
    textState.value = '';
    nextTick(() => textInputRef.value?.focus());
    return;
  }

  if (tool.value === 'fill') {
    floodFill(p.x, p.y, fgColor.value);
    pushHistory();
    return;
  }

  drawing = true;
  startX = p.x;
  startY = p.y;

  if (tool.value === 'pencil' || tool.value === 'eraser') {
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = lineWidth.value;
    g.strokeStyle = tool.value === 'eraser' ? bgColor.value : fgColor.value;
    g.lineTo(p.x + 0.1, p.y + 0.1);
    g.stroke();
  } else {
    snapshotBeforeShape = g.getImageData(0, 0, canvasRef.value!.width, canvasRef.value!.height);
  }
}

function onMouseMove(e: MouseEvent) {
  const p = getCanvasPos(e);
  mousePos.value = p;
  if (!drawing) return;
  const g = getCtx();
  if (!g) return;

  if (tool.value === 'pencil' || tool.value === 'eraser') {
    g.lineTo(p.x, p.y);
    g.stroke();
  } else if (snapshotBeforeShape) {
    g.putImageData(snapshotBeforeShape, 0, 0);
    drawShape(g, startX, startY, p.x, p.y);
  }
}

function onMouseUp() {
  if (!drawing) return;
  drawing = false;
  snapshotBeforeShape = null;
  pushHistory();
}

function onMouseLeave() {
  if (drawing) onMouseUp();
  mousePos.value = null;
}

function drawShape(
  g: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  g.lineWidth = lineWidth.value;
  g.strokeStyle = fgColor.value;
  g.fillStyle = fgColor.value;
  g.lineCap = 'round';

  switch (tool.value) {
    case 'line':
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
      break;
    case 'rect': {
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const w = Math.abs(x2 - x1);
      const h = Math.abs(y2 - y1);
      shapeFilled.value ? g.fillRect(x, y, w, h) : g.strokeRect(x, y, w, h);
      break;
    }
    case 'ellipse': {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;
      g.beginPath();
      g.ellipse(cx, cy, Math.max(rx, 0.1), Math.max(ry, 0.1), 0, 0, Math.PI * 2);
      shapeFilled.value ? g.fill() : g.stroke();
      break;
    }
  }
}

function hexToRgba(hex: string): [number, number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    255,
  ];
}

function floodFill(fx: number, fy: number, hex: string) {
  const g = getCtx();
  const c = canvasRef.value;
  if (!g || !c) return;
  const w = c.width;
  const h = c.height;
  if (fx < 0 || fx >= w || fy < 0 || fy >= h) return;

  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const fc = hexToRgba(hex);
  const idx0 = (fy * w + fx) * 4;
  const tr = d[idx0];
  const tg = d[idx0 + 1];
  const tb = d[idx0 + 2];
  const ta = d[idx0 + 3];

  if (tr === fc[0] && tg === fc[1] && tb === fc[2] && ta === fc[3]) return;

  const match = (i: number) =>
    d[i] === tr && d[i + 1] === tg && d[i + 2] === tb && d[i + 3] === ta;

  const queue = [fx, fy];
  while (queue.length) {
    const cy = queue.pop()!;
    let cx = queue.pop()!;

    while (cx > 0 && match((cy * w + cx - 1) * 4)) cx--;
    let di = (cy * w + cx) * 4;
    let spanUp = false;
    let spanDown = false;

    while (cx < w && match(di)) {
      d[di] = fc[0];
      d[di + 1] = fc[1];
      d[di + 2] = fc[2];
      d[di + 3] = fc[3];

      if (cy > 0) {
        const ui = ((cy - 1) * w + cx) * 4;
        if (match(ui)) {
          if (!spanUp) {
            queue.push(cx, cy - 1);
            spanUp = true;
          }
        } else {
          spanUp = false;
        }
      }
      if (cy < h - 1) {
        const li = ((cy + 1) * w + cx) * 4;
        if (match(li)) {
          if (!spanDown) {
            queue.push(cx, cy + 1);
            spanDown = true;
          }
        } else {
          spanDown = false;
        }
      }
      cx++;
      di += 4;
    }
  }
  g.putImageData(img, 0, 0);
}

function commitText() {
  if (!textState.show) return;
  if (textState.value.trim()) {
    const g = getCtx();
    if (g) {
      const fs = Math.max(lineWidth.value * 3, 14);
      g.font = `${fs}px sans-serif`;
      g.fillStyle = fgColor.value;
      g.textBaseline = 'top';
      textState.value.split('\n').forEach((line, i) => {
        g.fillText(line, textState.cx, textState.cy + i * fs * 1.3);
      });
      pushHistory();
    }
  }
  textState.show = false;
  textState.value = '';
}

function cancelText() {
  textState.show = false;
  textState.value = '';
}

function clearCanvas() {
  const g = getCtx();
  const c = canvasRef.value;
  if (!g || !c) return;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
  pushHistory();
}

function createNew() {
  filePath.value = '';
  win?.setTitle('画板');
  initCanvas(canvasW.value, canvasH.value);
}

async function saveFile() {
  const c = canvasRef.value;
  if (!c) return;
  let path = filePath.value || win?.config?.path;
  if (!path) {
    const desktop = join(sys._options.userLocation || '/C/Users', 'Desktop');
    path = join(desktop, `画板_${Date.now()}.vtimg`);
  }
  try {
    await sys.fs.writeFile(path, c.toDataURL('image/png'));
    filePath.value = path;
    win?.setTitle(path.split('/').pop() || '画板');
    new Notify({ title: '保存成功', content: `已保存到 ${path}` });
  } catch (e: any) {
    new Notify({ title: '保存失败', content: e?.message || '' });
  }
}

async function loadFile(path: string) {
  try {
    const content = await sys.fs.readFile(path);
    if (!content) return;
    filePath.value = path;
    win?.setTitle(path.split('/').pop() || '画板');
    const img = new Image();
    img.onload = () => {
      canvasW.value = img.width;
      canvasH.value = img.height;
      nextTick(() => {
        const c = canvasRef.value;
        const g = getCtx();
        if (!c || !g) return;
        c.width = img.width;
        c.height = img.height;
        g.drawImage(img, 0, 0);
        historyStack = [];
        historyIdx.value = -1;
        historyLen.value = 0;
        pushHistory();
      });
    };
    img.src = content;
  } catch {
    new Notify({ title: '打开失败', content: '文件格式不正确' });
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (textState.show) return;
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'z':
        e.preventDefault();
        undo();
        break;
      case 'y':
        e.preventDefault();
        redo();
        break;
      case 's':
        e.preventDefault();
        saveFile();
        break;
      case 'n':
        e.preventDefault();
        createNew();
        break;
    }
    return;
  }
  const keyMap: Record<string, ToolType> = {
    p: 'pencil',
    e: 'eraser',
    l: 'line',
    r: 'rect',
    o: 'ellipse',
    t: 'text',
    f: 'fill',
  };
  const mapped = keyMap[e.key.toLowerCase()];
  if (mapped) tool.value = mapped;
}

onMounted(async () => {
  await nextTick();
  const area = areaRef.value;
  if (area) {
    const rect = area.getBoundingClientRect();
    canvasW.value = Math.max(Math.floor(rect.width), 200);
    canvasH.value = Math.max(Math.floor(rect.height), 200);
  }
  if (win?.config?.path) {
    await loadFile(win.config.path);
  } else {
    initCanvas(canvasW.value, canvasH.value);
  }
  appRef.value?.focus();
});
</script>

<style scoped>
.paint-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f0f0;
  outline: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  user-select: none;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #fafafa;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.tool-sep {
  width: 1px;
  height: 24px;
  background: #ddd;
  margin: 0 4px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #333;
  cursor: pointer;
  padding: 0 4px;
  transition: all 0.15s;
}

.tool-btn:hover {
  background: #e8e8e8;
  border-color: #ccc;
}

.tool-btn.active {
  background: #d0e0f0;
  border-color: #90b0d0;
  color: #1a5a8a;
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.text-btn {
  font-size: 12px;
  padding: 0 8px;
}

.tb-ico {
  width: 16px;
  height: 16px;
}

.tb-text {
  font-size: 14px;
  font-weight: 700;
  font-family: serif;
}

.color-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.color-dot {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 2px solid #999;
  transition: border-color 0.15s;
}

.color-dot:hover {
  border-color: #555;
}

.bg-style {
  margin-left: 4px;
  border-style: dashed;
}

.sr-only-color {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.size-g {
  gap: 6px;
}

.size-num {
  font-size: 11px;
  color: #666;
  min-width: 30px;
  text-align: right;
}

.size-range {
  width: 80px;
  accent-color: #4a90d9;
}

.check-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #555;
  cursor: pointer;
}

.check-label input {
  accent-color: #4a90d9;
}

.palette-row {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 4px 8px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
}

.pal-swatch {
  width: 18px;
  height: 18px;
  border: 1px solid #bbb;
  border-radius: 2px;
  cursor: pointer;
  transition: transform 0.1s;
}

.pal-swatch:hover {
  transform: scale(1.2);
  border-color: #666;
  z-index: 1;
}

.pal-swatch.sel {
  border-color: #333;
  box-shadow: 0 0 0 2px #4a90d9;
}

.canvas-area {
  flex: 1;
  overflow: auto;
  background: #c0c0c0;
  position: relative;
}

.canvas-wrap {
  position: relative;
  flex-shrink: 0;
}

.canvas-wrap canvas {
  display: block;
}

.text-overlay {
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  border: 1px dashed #4a90d9;
  outline: none;
  resize: both;
  min-width: 60px;
  min-height: 30px;
  padding: 2px 4px;
  line-height: 1.3;
  z-index: 10;
  font-family: sans-serif;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 2px 12px;
  background: #f0f0f0;
  border-top: 1px solid #ddd;
  font-size: 11px;
  color: #666;
  flex-shrink: 0;
  height: 22px;
}

.sb-right {
  margin-left: auto;
}
</style>
