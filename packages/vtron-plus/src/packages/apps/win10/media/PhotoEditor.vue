<template>
  <section class="photo-editor" aria-label="编辑照片">
    <nav class="editor-tabs" aria-label="照片编辑工具">
      <button type="button" class="back" aria-label="返回照片" :disabled="saving" @click="close">
        <span class="mdl" aria-hidden="true">&#xE72B;</span>
      </button>
      <button
        v-for="tool in tools"
        :key="tool.id"
        type="button"
        :aria-pressed="activeTool === tool.id"
        :disabled="!image || saving || (!supportsFilters && (tool.id === 'adjust' || tool.id === 'filter'))"
        @click="selectTool(tool.id)"
      >{{ tool.name }}</button>
    </nav>

    <div class="editor-body">
      <div ref="stage" class="editor-stage">
        <div v-if="image" class="preview" :style="previewStyle">
          <canvas
            ref="preview"
            :class="{ interactive: activeTool === 'crop' || activeTool === 'draw' }"
            :aria-label="activeTool === 'crop' ? '在照片上拖动以裁剪' : '照片编辑预览'"
            @pointerdown="startPointer"
            @pointermove="movePointer"
            @pointerup="finishPointer"
            @pointercancel="cancelPointer"
            @lostpointercapture="cancelPointer"
          />
          <div v-if="activeTool === 'crop'" class="crop-selection" :style="cropStyle" aria-hidden="true">
            <span
              v-for="corner in corners"
              :key="corner"
              class="crop-handle"
              :class="corner"
              @pointerdown.stop="resizeCrop($event, corner)"
            ></span>
          </div>
        </div>
        <p v-else role="status">{{ loadError || '正在加载…' }}</p>
      </div>

      <aside class="editor-controls" :aria-label="toolName">
        <fieldset :disabled="!image || saving">
          <template v-if="activeTool === 'crop'">
            <label>纵横比
              <select v-model="aspect" @change="applyAspect">
                <option value="free">自由</option>
                <option value="original">原始比例</option>
                <option value="1:1">正方形（1:1）</option>
                <option value="4:3">4:3</option>
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
              </select>
            </label>
            <button type="button" @click="rotate">
              <span class="mdl" aria-hidden="true">&#xE7AD;</span> 顺时针旋转
            </button>
            <button type="button" @click="flip('x')">水平翻转</button>
            <button type="button" @click="flip('y')">垂直翻转</button>
            <button type="button" @click="resetCrop">重置裁剪</button>
          </template>
          <template v-else-if="activeTool === 'adjust'">
            <label>亮度 <output>{{ brightness }}</output>
              <input v-model.number="brightness" type="range" min="50" max="150" />
            </label>
            <label>对比度 <output>{{ contrast }}</output>
              <input v-model.number="contrast" type="range" min="50" max="150" />
            </label>
            <label>饱和度 <output>{{ saturation }}</output>
              <input v-model.number="saturation" type="range" min="0" max="200" />
            </label>
          </template>
          <template v-else-if="activeTool === 'filter'">
            <div class="filter-grid" aria-label="滤镜">
              <button
                v-for="(value, key) in filters"
                :key="key"
                type="button"
                :aria-pressed="filter === key"
                @click="filter = key"
              ><img :src="image?.src" alt="" :style="{ filter: value.css }" />{{ value.name }}</button>
            </div>
          </template>
          <template v-else>
            <label class="draw-color">颜色 <input v-model="penColor" type="color" /></label>
            <label>粗细 <output>{{ penWidth }}</output>
              <input v-model.number="penWidth" type="range" min="1" max="24" />
            </label>
            <button type="button" :disabled="!strokes.length" @click="strokes = strokes.slice(0, -1)">撤消笔迹</button>
          </template>
        </fieldset>
      </aside>
    </div>

    <footer class="editor-footer">
      <button type="button" :disabled="!dirty || saving" @click="reset">撤消所有更改</button>
      <div class="save-actions">
        <button v-if="canOverwrite" type="button" :disabled="!dirty || saving" @click="save(true)">保存</button>
        <button type="button" class="primary" :disabled="!image || saving" @click="save(false)">
          {{ saving ? '正在保存…' : '保存副本' }}
        </button>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, shallowRef, triggerRef, watch } from 'vue';
import { Dialog, System, join } from 'vtron';
import { message, type MediaSource, virtualMedia } from './mediaFiles';

type Tool = 'crop' | 'adjust' | 'filter' | 'draw';
type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type Point = { x: number; y: number };
type Region = Point & { width: number; height: number };
type Stroke = { color: string; width: number; points: Point[] };
type FileStamp = { time: number; size: number };
const props = defineProps<{ url: string; path: string; name: string; library: string; initialTool?: Tool }>();
const emit = defineEmits<{ (event: 'close'): void; (event: 'saved', path: string): void }>();
const system = inject<System>('system')!;
const tools: { id: Tool; name: string }[] = [
  { id: 'crop', name: '裁剪和旋转' },
  { id: 'adjust', name: '调整' },
  { id: 'filter', name: '滤镜' },
  { id: 'draw', name: '绘制' },
];
const filters = {
  original: { name: '原图', css: 'none' },
  vivid: { name: '鲜艳', css: 'saturate(1.45) contrast(1.08)' },
  warm: { name: '暖色', css: 'sepia(.28) saturate(1.2)' },
  cool: { name: '冷色', css: 'sepia(.28) hue-rotate(155deg)' },
  mono: { name: '黑白', css: 'grayscale(1)' },
  sepia: { name: '怀旧', css: 'sepia(.72)' },
};
const activeTool = ref<Tool>(props.initialTool ?? 'crop');
const toolName = computed(() => tools.find(({ id }) => id === activeTool.value)?.name);
const stage = ref<HTMLElement>();
const preview = ref<HTMLCanvasElement>();
const image = shallowRef<HTMLImageElement>();
const supportsFilters = ref(true);
const loadError = ref('');
const available = ref({ width: 520, height: 350 });
const saving = ref(false);
const sourceStamp = ref<FileStamp>();
const canOverwrite = computed(() => !!sourceStamp.value && /\.(png|jpe?g)$/i.test(props.path));
const angle = ref(0);
const flipX = ref(false);
const flipY = ref(false);
const brightness = ref(100);
const contrast = ref(100);
const saturation = ref(100);
const filter = ref<keyof typeof filters>('original');
const penColor = ref('#ffda44');
const penWidth = ref(6);
const strokes = ref<Stroke[]>([]);
const draftStroke = shallowRef<Stroke>();
const aspect = ref('free');
const corners: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const fullRegion = (): Region => ({ x: 0, y: 0, width: 1, height: 1 });
const crop = ref<Region>(fullRegion());
const draftCrop = ref<Region>();
let gesture: { id: number; tool: 'crop' | 'draw'; origin: Point; start: Point } | undefined;
let observer: ResizeObserver | undefined;
let openedSource: MediaSource | undefined;
let frame = 0;
let disposed = false;
let closeRequest: Promise<boolean> | undefined;

const oriented = computed(() => {
  const width = image.value?.naturalWidth || 1;
  const height = image.value?.naturalHeight || 1;
  return angle.value % 180 ? { width: height, height: width } : { width, height };
});
const previewRegion = computed(() => activeTool.value === 'crop' ? fullRegion() : crop.value);
const previewStyle = computed(() => {
  const width = oriented.value.width * previewRegion.value.width;
  const height = oriented.value.height * previewRegion.value.height;
  const scale = Math.min(available.value.width / width, available.value.height / height, 3);
  return { width: Math.max(1, width * scale) + 'px', height: Math.max(1, height * scale) + 'px' };
});
const cropStyle = computed(() => {
  const region = draftCrop.value ?? crop.value;
  return {
    left: region.x * 100 + '%', top: region.y * 100 + '%',
    width: region.width * 100 + '%', height: region.height * 100 + '%',
  };
});
const dirty = computed(() => {
  const { x, y, width, height } = crop.value;
  return angle.value !== 0 || flipX.value || flipY.value || x !== 0 || y !== 0 || width !== 1 || height !== 1 ||
    brightness.value !== 100 || contrast.value !== 100 || saturation.value !== 100 ||
    filter.value !== 'original' || strokes.value.length > 0;
});

function render(target: HTMLCanvasElement, region: Region, maxSide: number, matte = false) {
  const source = image.value;
  if (!source) throw new Error('未能加载照片。');
  const { width, height } = oriented.value;
  const naturalWidth = width * region.width;
  const naturalHeight = height * region.height;
  const scale = Math.min(1, maxSide / Math.max(naturalWidth, naturalHeight));
  target.width = Math.max(1, Math.round(naturalWidth * scale));
  target.height = Math.max(1, Math.round(naturalHeight * scale));
  const ctx = target.getContext('2d');
  if (!ctx) throw new Error('无法创建图片画布。');
  if (matte) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, target.width, target.height);
  }
  ctx.scale(target.width / naturalWidth, target.height / naturalHeight);
  ctx.translate(-region.x * width, -region.y * height);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(flipX.value ? -1 : 1, flipY.value ? -1 : 1);
  ctx.rotate(angle.value * Math.PI / 180);
  const effects: string[] = [];
  if (brightness.value !== 100) effects.push('brightness(' + brightness.value + '%)');
  if (contrast.value !== 100) effects.push('contrast(' + contrast.value + '%)');
  if (saturation.value !== 100) effects.push('saturate(' + saturation.value + '%)');
  if (filter.value !== 'original') effects.push(filters[filter.value].css);
  if (effects.length) ctx.filter = effects.join(' ');
  ctx.drawImage(source, -source.naturalWidth / 2, -source.naturalHeight / 2);
  ctx.restore();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const marks = draftStroke.value ? [...strokes.value, draftStroke.value] : strokes.value;
  for (const stroke of marks) {
    const first = stroke.points[0];
    if (!first) continue;
    ctx.lineWidth = stroke.width * Math.min(width, height);
    ctx.beginPath();
    if (stroke.points.length === 1) {
      ctx.arc(first.x * width, first.y * height, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.color;
      ctx.fill();
    } else {
      ctx.moveTo(first.x * width, first.y * height);
      for (const point of stroke.points.slice(1)) ctx.lineTo(point.x * width, point.y * height);
      ctx.strokeStyle = stroke.color;
      ctx.stroke();
    }
  }
}

watch([preview, image, previewRegion, angle, flipX, flipY, brightness, contrast, saturation, filter, strokes, draftStroke], () => {
  if (!preview.value || !image.value) return;
  const canvas = preview.value;
  const region = previewRegion.value;
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    try {
      render(canvas, region, 1200);
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : '无法预览此照片。';
      image.value = undefined;
    }
  });
}, { flush: 'post' });

function selectTool(tool: Tool) {
  cancelPointer();
  activeTool.value = tool;
}

function transformMarks(map: (point: Point) => Point) {
  const current = crop.value;
  const a = map(current);
  const b = map({ x: current.x + current.width, y: current.y + current.height });
  crop.value = { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) };
  strokes.value = strokes.value.map((stroke) => ({ ...stroke, points: stroke.points.map(map) }));
}
function rotate() {
  cancelPointer();
  angle.value = (angle.value + 90) % 360;
  [flipX.value, flipY.value] = [flipY.value, flipX.value];
  transformMarks(({ x, y }) => ({ x: 1 - y, y: x }));
  aspect.value = 'free';
}
function flip(axis: 'x' | 'y') {
  cancelPointer();
  if (axis === 'x') flipX.value = !flipX.value;
  else flipY.value = !flipY.value;
  transformMarks(({ x, y }) => axis === 'x' ? { x: 1 - x, y } : { x, y: 1 - y });
}
function resetCrop() {
  crop.value = fullRegion();
  aspect.value = 'free';
}
function reset() {
  cancelPointer();
  resetCrop();
  angle.value = 0;
  flipX.value = false;
  flipY.value = false;
  brightness.value = contrast.value = saturation.value = 100;
  filter.value = 'original';
  strokes.value = [];
}
function aspectRatio() {
  if (aspect.value === 'free') return;
  const { width, height } = oriented.value;
  if (aspect.value === 'original') return 1;
  const [x, y] = aspect.value.split(':').map(Number);
  return x * height / (y * width);
}
function applyAspect() {
  const ratio = aspectRatio();
  if (!ratio) return;
  const width = Math.min(1, ratio);
  const height = Math.min(1, 1 / ratio);
  crop.value = { x: (1 - width) / 2, y: (1 - height) / 2, width, height };
}
function pointerPosition(event: PointerEvent): Point {
  const rect = preview.value!.getBoundingClientRect();
  const area = previewRegion.value;
  return {
    x: area.x + Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) * area.width,
    y: area.y + Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) * area.height,
  };
}
function startPointer(event: PointerEvent, anchor?: Point) {
  const tool = activeTool.value;
  if (!preview.value || saving.value || gesture || event.button !== 0 || (tool !== 'crop' && tool !== 'draw')) return;
  const origin = anchor ?? pointerPosition(event);
  gesture = { id: event.pointerId, tool, origin, start: { x: event.clientX, y: event.clientY } };
  preview.value.setPointerCapture(event.pointerId);
  if (tool === 'draw') draftStroke.value = { color: penColor.value, width: penWidth.value / 600, points: [origin] };
}
function resizeCrop(event: PointerEvent, corner: Corner) {
  const { x, y, width, height } = crop.value;
  startPointer(event, {
    x: corner.endsWith('left') ? x + width : x,
    y: corner.startsWith('top') ? y + height : y,
  });
}
function movePointer(event: PointerEvent) {
  if (!gesture || gesture.id !== event.pointerId) return;
  const point = pointerPosition(event);
  if (gesture.tool === 'crop') {
    const { origin } = gesture;
    let dx = point.x - origin.x;
    let dy = point.y - origin.y;
    const ratio = aspectRatio();
    if (ratio) {
      const width = Math.min(Math.abs(dx), Math.abs(dy) * ratio);
      dx = Math.sign(dx) * width;
      dy = Math.sign(dy) * width / ratio;
    }
    draftCrop.value = {
      x: Math.min(origin.x, origin.x + dx), y: Math.min(origin.y, origin.y + dy),
      width: Math.abs(dx), height: Math.abs(dy),
    };
  } else if (draftStroke.value) {
    draftStroke.value.points.push(point);
    triggerRef(draftStroke);
  }
}
function finishPointer(event: PointerEvent) {
  if (gesture?.id !== event.pointerId) return;
  if (gesture.tool === 'crop') {
    const { start } = gesture;
    movePointer(event);
    const region = draftCrop.value;
    if (region && Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 3 &&
      region.width * oriented.value.width >= 1 && region.height * oriented.value.height >= 1) crop.value = region;
  } else if (draftStroke.value) {
    const stroke = draftStroke.value;
    const point = pointerPosition(event);
    const last = stroke.points[stroke.points.length - 1];
    if (point.x !== last.x || point.y !== last.y) stroke.points.push(point);
    strokes.value = [...strokes.value, stroke];
  }
  cancelPointer();
}
function cancelPointer() {
  const active = gesture;
  gesture = undefined;
  draftCrop.value = undefined;
  draftStroke.value = undefined;
  if (active && preview.value?.hasPointerCapture(active.id)) preview.value.releasePointerCapture(active.id);
}

async function readStamp(path: string): Promise<FileStamp | undefined> {
  const entry = await system.fs.stat(path);
  if (entry?.isFile && !entry.isSymlink) return { size: entry.size, time: new Date(entry.mtime).getTime() };
}
function sameStamp(first?: FileStamp, second?: FileStamp) {
  return !!first && !!second && first.time === second.time && first.size === second.size;
}
async function copyPath() {
  if (!(await system.fs.stat(props.library))) await system.fs.mkdir(props.library);
  const stem = props.name.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, '_').trim() || '照片';
  const base = stem + ' - 副本';
  let destination = join(props.library, base + '.png');
  for (let suffix = 2; await system.fs.stat(destination); suffix++) {
    destination = join(props.library, base + ' (' + suffix + ').png');
  }
  return destination;
}
function encode(canvas: HTMLCanvasElement, format: string): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (blob?.type === format && blob.size) resolve(blob);
    else reject(new Error('无法以所选格式保存照片。'));
  }, format, .94));
}
function asDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('无法读取编辑后的照片。'));
    reader.readAsDataURL(blob);
  });
}
async function save(overwrite: boolean) {
  if (!image.value || saving.value || (overwrite && !canOverwrite.value)) return;
  cancelPointer();
  saving.value = true;
  try {
    if (overwrite) {
      const answer = await Dialog.showMessageBox({
        title: '保存照片',
        message: '要将更改保存到原照片吗？',
        type: 'warning',
        buttons: ['保存', '取消'],
      });
      if (answer.response !== 0) return;
    }
    const destination = overwrite ? props.path : await copyPath();
    const format = overwrite && /\.jpe?g$/i.test(destination) ? 'image/jpeg' : 'image/png';
    const output = document.createElement('canvas');
    render(output, crop.value, Infinity, format === 'image/jpeg');
    const blob = await encode(output, format);
    if (overwrite && !sameStamp(await readStamp(destination), sourceStamp.value)) {
      throw new Error('原照片已变化，请保存副本。');
    }
    const options = { flag: overwrite ? 'w' as const : 'wx' as const };
    if (system.fs.writeBinaryFile && system.fs.readBinaryFile) {
      await system.fs.writeBinaryFile(destination, new Uint8Array(await blob.arrayBuffer()), options);
    } else {
      const data = await asDataUrl(blob);
      await system.fs.writeFile(destination, data, options);
      if (await system.fs.readFile(destination) !== data) throw new Error('无法保存照片。');
    }
    if (!disposed) emit('saved', destination);
  } catch (error) {
    if (!disposed) await message('保存照片', error);
  } finally {
    saving.value = false;
  }
}
async function confirmClose() {
  if (saving.value) return false;
  if (!dirty.value) return true;
  if (!closeRequest) {
    closeRequest = Dialog.showMessageBox({
      title: '编辑照片',
      message: '要放弃未保存的更改吗？',
      type: 'warning',
      buttons: ['放弃更改', '继续编辑'],
    }).then((answer) => answer.response === 0).finally(() => { closeRequest = undefined; });
  }
  return closeRequest;
}
async function close() {
  if (await confirmClose()) emit('close');
}
defineExpose({ confirmClose });

onMounted(async () => {
  const context = document.createElement('canvas').getContext('2d');
  supportsFilters.value = !!context && 'filter' in context;
  if (!supportsFilters.value && (activeTool.value === 'adjust' || activeTool.value === 'filter')) selectTool('crop');
  if (stage.value) {
    observer = new ResizeObserver(([entry]) => {
      available.value = {
        width: Math.max(1, entry.contentRect.width),
        height: Math.max(1, entry.contentRect.height),
      };
    });
    observer.observe(stage.value);
  }
  if (/\.(png|jpe?g)$/i.test(props.path)) {
    // Read the current file so an older viewer snapshot cannot overwrite a newer version.
    try {
      const stamp = await readStamp(props.path);
      if (stamp && !disposed) {
        const media = await virtualMedia(system, props.path, 'image');
        if (disposed) { media.release(); return; }
        openedSource = media;
        if (sameStamp(stamp, await readStamp(props.path))) sourceStamp.value = stamp;
      }
    } catch {
      // The viewer snapshot can still be saved as a copy.
    }
  }
  if (disposed) return;
  try {
    const input = new Image();
    input.src = openedSource?.url ?? props.url;
    await input.decode();
    if (!disposed) image.value = input;
  } catch {
    if (!disposed) loadError.value = '无法打开此照片进行编辑。';
  }
});
onBeforeUnmount(() => {
  disposed = true;
  observer?.disconnect();
  openedSource?.release();
  cancelAnimationFrame(frame);
});
</script>

<style scoped>
.photo-editor {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  color-scheme: dark;
  background: #171717;
}
.editor-tabs, .editor-footer {
  display: flex;
  align-items: stretch;
  flex: none;
  min-height: 44px;
  background: #202020;
}
.editor-tabs { overflow-x: auto; }
button, input, select {
  color: inherit;
  font: inherit;
}
button {
  min-height: 32px;
  padding: 0 13px;
  color: inherit;
  background: #343434;
  border: 1px solid transparent;
  border-radius: 0;
}
button:hover:enabled { background: #454545; }
button:focus-visible, select:focus-visible, input:focus-visible {
  outline: 1px solid #8ecaff;
  outline-offset: -2px;
}
button:disabled { opacity: .45; }
.editor-tabs button {
  min-width: 48px;
  border-bottom: 3px solid transparent;
  background: transparent;
  white-space: nowrap;
}
.editor-tabs button[aria-pressed='true'] { border-bottom-color: #0078d7; }
.mdl { font: 17px/1 'SEGOEUIMDL'; }
.editor-body {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(142px, 29%, 270px);
}
.editor-stage {
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 16px;
  background: #000;
}
.preview {
  position: relative;
  overflow: hidden;
  background: repeating-conic-gradient(#252525 0% 25%, #1c1c1c 0% 50%) 0 0 / 16px 16px;
}
.preview canvas { display: block; width: 100%; height: 100%; }
.preview canvas.interactive { touch-action: none; cursor: crosshair; }
.crop-selection {
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
  border: 1px solid #eee;
  box-shadow: 0 0 0 9999px #0009;
  background:
    linear-gradient(to right, transparent calc(33.333% - .5px), #ffffff80 33.333%, transparent calc(33.333% + .5px), transparent calc(66.667% - .5px), #ffffff80 66.667%, transparent calc(66.667% + .5px)),
    linear-gradient(to bottom, transparent calc(33.333% - .5px), #ffffff80 33.333%, transparent calc(33.333% + .5px), transparent calc(66.667% - .5px), #ffffff80 66.667%, transparent calc(66.667% + .5px));
}
.crop-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  pointer-events: auto;
  touch-action: none;
}
.top-left { top: -1px; left: -1px; border-right: 0; border-bottom: 0; cursor: nwse-resize; }
.top-right { top: -1px; right: -1px; border-left: 0; border-bottom: 0; cursor: nesw-resize; }
.bottom-left { bottom: -1px; left: -1px; border-right: 0; border-top: 0; cursor: nesw-resize; }
.bottom-right { bottom: -1px; right: -1px; border-left: 0; border-top: 0; cursor: nwse-resize; }
.editor-controls {
  overflow: auto;
  padding: 15px;
  background: #252525;
}
.editor-controls fieldset {
  display: grid;
  gap: 12px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.editor-controls fieldset > button { text-align: left; }
.editor-controls label { display: block; }
.editor-controls output { float: right; }
.editor-controls select, .editor-controls input[type='range'] {
  display: block;
  width: 100%;
  margin: 7px 0 0;
  accent-color: #0078d7;
}
.editor-controls select {
  min-height: 32px;
  padding: 4px;
  background: #303030;
  border: 1px solid #626262;
  border-radius: 0;
}
.editor-controls .draw-color {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(66px, 1fr)); gap: 7px; }
.filter-grid button { min-width: 0; padding: 0 0 4px; }
.filter-grid button[aria-pressed='true'] { border-color: #67b9ff; }
.filter-grid img { display: block; width: 100%; height: 46px; margin-bottom: 3px; object-fit: cover; }
.editor-footer {
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 14px;
}
.save-actions { display: flex; gap: 7px; }
.primary { background: #0078d7; }
.primary:hover:enabled { background: #006cbe; }
</style>
