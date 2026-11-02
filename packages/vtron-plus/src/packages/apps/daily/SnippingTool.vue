<template>
  <Win10Frame :icon="win?.windowInfo.icon" title="截图工具" background="#f0f0f0" titlebar-background="#fff">
    <div class="snipping-tool" @keydown="onKeydown" tabindex="-1">
      <nav v-if="imageData" class="menu-bar" aria-label="截图工具菜单">
        <button
          v-for="item in menuLabels"
          :key="item"
          :class="{ active: openMenu === item }"
          @click="openMenu = openMenu === item ? '' : item"
        >
          {{ item }}
        </button>
      </nav>
      <div v-if="openMenu" class="menu-popup" role="menu">
        <template v-if="openMenu === '文件(F)'"
          ><button
            role="menuitem"
            :disabled="!captureSupported || busy"
            @click="
              openMenu = '';
              capture();
            "
          >
            新建截图<span>Ctrl+N</span></button
          ><button
            role="menuitem"
            :disabled="!imageData || selecting || busy"
            @click="
              openMenu = '';
              saveImage();
            "
          >
            另存为…<span>Ctrl+S</span></button
          ><button role="menuitem" disabled>发送到</button
          ><button role="menuitem" disabled>打印…<span>Ctrl+P</span></button></template
        >
        <template v-else-if="openMenu === '编辑(E)'"
          ><button
            role="menuitem"
            :disabled="!imageData || selecting || !copySupported"
            @click="
              openMenu = '';
              copyImage();
            "
          >
            复制<span>Ctrl+C</span>
          </button></template
        >
        <template v-else-if="openMenu === '工具(T)'"
          ><button role="menuitem" disabled>笔</button><button role="menuitem" disabled>荧光笔</button
          ><button role="menuitem" disabled>橡皮擦</button
          ><button role="menuitem" disabled>选项…</button></template
        >
        <template v-else
          ><button role="menuitem" disabled>查看帮助</button
          ><button role="menuitem" disabled>关于截图工具</button></template
        >
      </div>
      <div class="toolbar" aria-label="截图操作">
        <button class="tool-button" :disabled="!captureSupported || busy" @click="capture">
          <span class="mdl scissors" aria-hidden="true">&#xE8C6;</span><span>新建(N)</span>
        </button>
        <div class="toolbar-dropdown">
          <button
            class="tool-button"
            :disabled="busy"
            @click="
              modeOpen = !modeOpen;
              delayOpen = false;
            "
          >
            <span class="mdl blue" aria-hidden="true">&#xE7EF;</span><span>模式(M)</span
            ><span class="mdl chevron" aria-hidden="true">&#xE70D;</span>
          </button>
          <div v-if="modeOpen" class="drop-menu" role="menu">
            <button disabled role="menuitem">任意格式截图</button
            ><button
              role="menuitemradio"
              :aria-checked="mode === 'rectangle'"
              @click="
                mode = 'rectangle';
                modeOpen = false;
              "
            >
              矩形截图</button
            ><button disabled role="menuitem">窗口截图</button
            ><button
              role="menuitemradio"
              :aria-checked="mode === 'full'"
              @click="
                mode = 'full';
                modeOpen = false;
              "
            >
              全屏截图
            </button>
          </div>
        </div>
        <div class="toolbar-dropdown">
          <button
            class="tool-button"
            :disabled="busy"
            @click="
              delayOpen = !delayOpen;
              modeOpen = false;
            "
          >
            <span class="mdl clock" aria-hidden="true">&#xE823;</span><span>延迟(D)</span
            ><span class="mdl chevron" aria-hidden="true">&#xE70D;</span>
          </button>
          <div v-if="delayOpen" class="drop-menu delay-menu" role="menu">
            <button
              v-for="seconds in [0, 1, 2, 3, 4, 5]"
              :key="seconds"
              role="menuitemradio"
              :aria-checked="delaySeconds === seconds"
              @click="
                delaySeconds = seconds;
                delayOpen = false;
              "
            >
              {{ seconds ? `${seconds} 秒` : '无延迟' }}
            </button>
          </div>
        </div>
        <button class="tool-button" :disabled="!busy && !selecting" @click="cancelCapture">
          <span class="mdl cancel-icon" aria-hidden="true">&#xE711;</span><span>取消</span>
        </button>
        <button class="tool-button" disabled>
          <span class="mdl options-icon" aria-hidden="true">&#xE713;</span><span>选项(O)</span>
        </button>
      </div>
      <div v-if="imageData" class="annotation-toolbar" aria-label="截图编辑">
        <button :disabled="selecting || busy" title="保存截图" aria-label="保存截图" @click="saveImage">
          <span class="mdl" aria-hidden="true">&#xE74E;</span></button
        ><button
          :disabled="selecting || !copySupported"
          title="复制截图"
          aria-label="复制截图"
          @click="copyImage"
        >
          <span class="mdl" aria-hidden="true">&#xE8C8;</span></button
        ><span class="separator"></span
        ><button disabled title="笔" aria-label="笔">
          <span class="mdl" aria-hidden="true">&#xE70F;</span></button
        ><button disabled title="荧光笔" aria-label="荧光笔">
          <span class="mdl" aria-hidden="true">&#xE7E6;</span></button
        ><button disabled title="橡皮擦" aria-label="橡皮擦">
          <span class="mdl" aria-hidden="true">&#xE75C;</span></button
        ><button disabled title="使用画图 3D 进行编辑" aria-label="使用画图 3D 进行编辑">
          <span class="mdl" aria-hidden="true">&#xE7C3;</span>
        </button>
      </div>
      <div class="workspace" @click="closeMenus">
        <div v-if="!imageData" class="empty-state">
          <p>
            {{
              countdown > 0
                ? `${countdown} 秒后开始截图`
                : busy
                  ? '请在浏览器窗口中选择要共享的屏幕或窗口。'
                  : captureSupported
                    ? '选择截图模式，或单击“新建”按钮。'
                    : '当前浏览器不支持屏幕截图。'
            }}
          </p>
          <button class="empty-help" disabled title="查看帮助" aria-label="查看帮助">
            <span class="mdl" aria-hidden="true">&#xE897;</span>
          </button>
        </div>
        <div v-else class="canvas-wrap">
          <canvas
            ref="canvasRef"
            :class="{ selecting }"
            aria-label="截图预览；矩形模式下拖动选择区域"
            @pointerdown="beginSelection"
            @pointermove="moveSelection"
            @pointerup="finishSelection"
            @pointercancel="resetSelection"
          ></canvas>
        </div>
      </div>
      <div v-if="saveOpen" class="modal-backdrop" @keydown.esc.stop="!saveBusy && (saveOpen = false)">
        <form
          class="save-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-title"
          @submit.prevent="confirmSave"
        >
          <h2 id="save-title">保存截图</h2>
          <label for="snip-save-path">文件路径</label
          ><input
            id="snip-save-path"
            ref="saveInput"
            v-model="savePath"
            :disabled="saveBusy"
            autocomplete="off"
          />
          <div class="dialog-buttons">
            <button type="submit" :disabled="saveBusy">保存</button
            ><button type="button" :disabled="saveBusy" @click="saveOpen = false">取消</button>
          </div>
        </form>
      </div>
      <div v-if="selecting" class="capture-hint">拖动鼠标选择要保留的矩形区域。</div>
      <div v-if="message" class="message" :class="{ error: messageIsError }" role="status">{{ message }}</div>
    </div>
  </Win10Frame>
</template>

<script setup lang="ts">
import { inject, nextTick, onUnmounted, ref } from 'vue';
import { BrowserWindow, Dialog, System } from 'vtron';
import Win10Frame from './Win10Frame.vue';
const system = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');
const captureSupported = !!navigator.mediaDevices?.getDisplayMedia;
const copySupported = typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write;
const menuLabels = ['文件(F)', '编辑(E)', '工具(T)', '帮助(H)'];
const openMenu = ref('');
const modeOpen = ref(false);
const delayOpen = ref(false);
const mode = ref<'rectangle' | 'full'>('rectangle');
const delaySeconds = ref(0);
const countdown = ref(0);
const busy = ref(false);
const selecting = ref(false);
const imageData = ref('');
const canvasRef = ref<HTMLCanvasElement>();
const message = ref('');
const saveOpen = ref(false);
const savePath = ref('');
const saveBusy = ref(false);
const saveInput = ref<HTMLInputElement>();
const messageIsError = ref(false);
let stream: MediaStream | undefined;
let image: HTMLImageElement | undefined;
let captureVersion = 0;
let disposed = false;
let delayTimer: ReturnType<typeof setTimeout> | undefined;
let finishDelay: (() => void) | undefined;
let selectionStart: { x: number; y: number } | undefined;
let selectionEnd: { x: number; y: number } | undefined;
function closeMenus() {
  openMenu.value = '';
  modeOpen.value = false;
  delayOpen.value = false;
}
function report(text: string, isError = false) {
  message.value = text;
  messageIsError.value = isError;
}
function stopStream() {
  stream?.getTracks().forEach((track) => track.stop());
  stream = undefined;
}
function cancelCapture() {
  ++captureVersion;
  clearTimeout(delayTimer);
  finishDelay?.();
  finishDelay = undefined;
  stopStream();
  countdown.value = 0;
  busy.value = false;
  selecting.value = false;
  resetSelection();
}
async function pauseSecond() {
  await new Promise<void>((resolve) => {
    finishDelay = resolve;
    delayTimer = setTimeout(resolve, 1000);
  });
  finishDelay = undefined;
}
async function showImage(data: string, version = captureVersion) {
  const next = new Image();
  await new Promise<void>((resolve, reject) => {
    next.onload = () => resolve();
    next.onerror = () => reject(new Error('无法显示截图'));
    next.src = data;
  });
  if (disposed || version !== captureVersion) return;
  image = next;
  imageData.value = data;
  await nextTick();
  drawPreview();
}
function drawPreview() {
  const canvas = canvasRef.value;
  if (!canvas || !image) return;
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.drawImage(image, 0, 0);
  if (selecting.value && selectionStart && selectionEnd) {
    const x = Math.min(selectionStart.x, selectionEnd.x),
      y = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x),
      height = Math.abs(selectionEnd.y - selectionStart.y);
    context.fillStyle = '#0005';
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (width && height) context.drawImage(image, x, y, width, height, x, y, width, height);
    context.strokeStyle = '#e00000';
    context.lineWidth = Math.max(1, canvas.width / canvas.clientWidth);
    context.strokeRect(x, y, width, height);
  }
}
async function capture() {
  if (!captureSupported || busy.value || saveOpen.value) return;
  closeMenus();
  report('');
  busy.value = true;
  const version = ++captureVersion;
  try {
    // Keep the permission request directly in the user gesture. Delay begins
    // only after the user has selected the source in the browser picker.
    const selected = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    if (disposed || version !== captureVersion) {
      selected.getTracks().forEach((track) => track.stop());
      return;
    }
    stream = selected;
    for (let seconds = delaySeconds.value; seconds > 0; seconds--) {
      countdown.value = seconds;
      await pauseSecond();
      if (version !== captureVersion) return;
    }
    countdown.value = 0;
    const video = document.createElement('video');
    video.muted = true;
    video.srcObject = selected;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('无法读取共享画面'));
    });
    await video.play();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (disposed || version !== captureVersion) {
      video.srcObject = null;
      return;
    }
    if (!video.videoWidth || !video.videoHeight) throw new Error('共享画面不可用，请重新选择。');
    const output = document.createElement('canvas');
    output.width = video.videoWidth;
    output.height = video.videoHeight;
    const context = output.getContext('2d');
    if (!context) throw new Error('浏览器不支持图像处理。');
    context.drawImage(video, 0, 0);
    video.pause();
    video.srcObject = null;
    selecting.value = mode.value === 'rectangle';
    selectionStart = undefined;
    selectionEnd = undefined;
    await showImage(output.toDataURL('image/png'));
  } catch (error) {
    if (version !== captureVersion || disposed) return;
    report(
      error instanceof DOMException && error.name === 'NotAllowedError'
        ? '已取消截图或未授予屏幕共享权限。'
        : error instanceof Error
          ? error.message
          : '无法截取屏幕。',
      true
    );
  } finally {
    if (version === captureVersion) {
      stopStream();
      busy.value = false;
      countdown.value = 0;
    }
  }
}
function point(event: PointerEvent) {
  const rect = canvasRef.value!.getBoundingClientRect();
  return {
    x: Math.max(
      0,
      Math.min(image!.naturalWidth, ((event.clientX - rect.left) * image!.naturalWidth) / rect.width)
    ),
    y: Math.max(
      0,
      Math.min(image!.naturalHeight, ((event.clientY - rect.top) * image!.naturalHeight) / rect.height)
    ),
  };
}
function beginSelection(event: PointerEvent) {
  if (!selecting.value || !image || event.button !== 0) return;
  selectionStart = point(event);
  selectionEnd = selectionStart;
  canvasRef.value?.setPointerCapture(event.pointerId);
  event.preventDefault();
}
function moveSelection(event: PointerEvent) {
  if (!selectionStart || !selecting.value) return;
  selectionEnd = point(event);
  drawPreview();
}
function resetSelection() {
  selectionStart = undefined;
  selectionEnd = undefined;
  drawPreview();
}
async function finishSelection(event: PointerEvent) {
  if (!selectionStart || !selecting.value || !image) return;
  selectionEnd = point(event);
  const x = Math.round(Math.min(selectionStart.x, selectionEnd.x)),
    y = Math.round(Math.min(selectionStart.y, selectionEnd.y));
  const width = Math.round(Math.abs(selectionEnd.x - selectionStart.x)),
    height = Math.round(Math.abs(selectionEnd.y - selectionStart.y));
  if (width < 2 || height < 2) {
    resetSelection();
    return;
  }
  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  output.getContext('2d')!.drawImage(image, x, y, width, height, 0, 0, width, height);
  selecting.value = false;
  selectionStart = undefined;
  selectionEnd = undefined;
  await showImage(output.toDataURL('image/png'));
}
function imageBlob() {
  const bytes = Uint8Array.from(atob(imageData.value.split(',')[1]), (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: 'image/png' });
}
async function saveImage() {
  if (!imageData.value || selecting.value) return;
  closeMenus();
  const directory = `${system._options.userLocation || '/C/Users/'}Photo`;
  const name = `截图 ${new Date().toISOString().replace(/[T:]/g, '-').slice(0, 19)}.png`;
  savePath.value = `${directory}/${name}`;
  saveOpen.value = true;
  await nextTick();
  saveInput.value?.focus();
  saveInput.value?.select();
}
async function confirmSave() {
  if (saveBusy.value) return;
  const path = savePath.value
    .trim()
    .replace(/^([a-z]):/i, (_, letter: string) => '/' + letter.toUpperCase())
    .replaceAll('\\', '/');
  if (!path.startsWith('/') || !path.toLowerCase().endsWith('.png')) {
    report('请输入以 .png 结尾的完整文件路径。', true);
    return;
  }
  saveBusy.value = true;
  try {
    const parent = path.slice(0, path.lastIndexOf('/')) || '/';
    if (parent === '/') {
      report('请选择磁盘内的保存目录。', true);
      return;
    }
    if (!(await system.fs.exists(parent))) {
      report('保存目录不存在。', true);
      return;
    }
    if (await system.fs.exists(path)) {
      const answer = await Dialog.showMessageBox({
        title: '保存截图',
        message: '文件已存在，是否替换？',
        buttons: ['替换', '取消'],
        type: 'warning',
      });
      if (answer.response !== 0) return;
    }
    // Images in the existing Vtron gallery use base64 payloads.
    await system.fs.writeFile(path, imageData.value.split(',')[1]);
    system.refershApp();
    saveOpen.value = false;
    report('已保存：' + path);
  } catch {
    report('保存失败，请检查路径及写入权限。', true);
  } finally {
    saveBusy.value = false;
  }
}

async function copyImage() {
  if (!imageData.value || selecting.value || !copySupported) return;
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': imageBlob() })]);
    report('已复制截图。');
  } catch {
    report('无法写入剪贴板，请使用保存。', true);
  }
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeMenus();
    if (busy.value || selecting.value) cancelCapture();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
    event.preventDefault();
    void capture();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    void saveImage();
  }
}
onUnmounted(() => {
  disposed = true;
  cancelCapture();
});
</script>

<style scoped>
.snipping-tool {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: #111;
  outline: none;
  font:
    12px/1.35 'Segoe UI',
    'Microsoft YaHei UI',
    sans-serif;
}
.snipping-tool * {
  box-sizing: border-box;
}
button {
  font: inherit;
  color: inherit;
  background: transparent;
  border: 1px solid transparent;
  padding: 0;
  border-radius: 0;
  cursor: default;
}
button:hover:enabled,
button.active {
  border-color: #a4cef9;
  background: #e5f3ff;
}
button:disabled {
  color: #929292;
}
button:disabled .mdl {
  opacity: 0.45;
}
button:focus-visible {
  outline: 1px dotted #555;
  outline-offset: -3px;
}
.mdl {
  font: 20px/1 'SEGOEUIMDL';
  flex-shrink: 0;
}
.menu-bar {
  height: 22px;
  display: flex;
  flex-shrink: 0;
  padding: 0 2px;
  background: #fff;
}
.menu-bar button {
  padding: 1px 8px;
}
.toolbar {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-height: 38px;
  padding: 2px;
  border-bottom: 1px solid #d6d6d6;
  gap: 1px;
  flex-wrap: wrap;
}
.tool-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 32px;
  padding: 2px 5px;
  white-space: nowrap;
  font-size: 12px;
}
.tool-button > .mdl:not(.chevron) {
  font-size: 24px;
}
.tool-button .chevron {
  font-size: 8px;
  margin-left: 4px;
}
.scissors {
  color: #ba4267;
}
.blue {
  color: #0986c7;
}
.clock,
.options-icon {
  color: #666;
}
.cancel-icon {
  color: #777;
}
.toolbar-dropdown {
  position: relative;
}
.drop-menu,
.menu-popup {
  position: absolute;
  z-index: 5;
  background: #f0f0f0;
  border: 1px solid #aaa;
  box-shadow: 2px 2px 3px #0003;
  padding: 2px;
  min-width: 168px;
}
.drop-menu {
  left: 0;
  top: 32px;
}
.drop-menu button,
.menu-popup button {
  display: block;
  width: 100%;
  height: 25px;
  text-align: left;
  white-space: nowrap;
  padding: 2px 18px 2px 25px;
}
.drop-menu button[aria-checked='true'] {
  background: #cce8ff;
}
.drop-menu button[aria-checked='true']::before {
  content: '•';
  position: absolute;
  left: 10px;
}
.menu-popup {
  top: 22px;
  left: 2px;
  min-width: 235px;
}
.menu-popup button {
  display: flex;
  justify-content: space-between;
  gap: 25px;
}
.menu-popup button span {
  color: #777;
}
.annotation-toolbar {
  display: flex;
  align-items: center;
  height: 34px;
  flex-shrink: 0;
  padding: 2px 5px;
  border-bottom: 1px solid #d6d6d6;
  gap: 3px;
}
.annotation-toolbar button {
  width: 30px;
  height: 29px;
}
.annotation-toolbar .mdl {
  font-size: 20px;
}
.separator {
  width: 1px;
  height: 22px;
  background: #ccc;
  margin: 0 4px;
}
.workspace {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #f0f0f0;
}
.empty-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 9px;
}
.empty-help {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}
.empty-help .mdl {
  color: #1683c4;
  font-size: 16px;
}
.empty-state p {
  flex: 1;
  margin: 0;
  line-height: 1.5;
}
.canvas-wrap {
  padding: 10px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}
canvas {
  display: block;
  max-width: 100%;
  height: auto;
  box-shadow: 0 0 0 1px #bbb;
  background: white;
  touch-action: none;
}
canvas.selecting {
  cursor: crosshair;
}
.capture-hint,
.message {
  padding: 5px 10px;
  font-size: 12px;
  border-top: 1px solid #ddd;
  flex-shrink: 0;
  background: #f5f5f5;
  overflow-wrap: anywhere;
}
.message.error {
  color: #a4262c;
  background: #fff7f6;
}
.modal-backdrop {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0002;
}
.save-dialog {
  width: min(440px, calc(100% - 30px));
  padding: 16px;
  border: 1px solid #999;
  background: #f0f0f0;
  box-shadow: 0 4px 18px #0004;
}
.save-dialog h2 {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 400;
}
.save-dialog label {
  display: block;
  margin-bottom: 5px;
}
.save-dialog input {
  box-sizing: border-box;
  width: 100%;
  height: 27px;
  padding: 3px 6px;
  border: 1px solid #888;
  border-radius: 0;
  font: inherit;
}
.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
.dialog-buttons button {
  min-width: 76px;
  height: 26px;
  padding: 2px 10px;
  border: 1px solid #adadad;
  background: #e1e1e1;
}
</style>
