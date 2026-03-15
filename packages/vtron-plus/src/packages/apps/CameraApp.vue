<template>
  <div class="camera-app">
    <div class="mode-bar">
      <button :class="{ active: mode === 'camera' }" @click="switchMode('camera')">
        相机
      </button>
      <button :class="{ active: mode === 'screenshot' }" @click="switchMode('screenshot')">
        截图
      </button>
    </div>

    <div class="main-view">
      <video
        v-show="mode === 'camera' && !currentPreview && cameraActive"
        ref="videoRef"
        autoplay
        playsinline
        muted
        :class="{ mirrored }"
      ></video>

      <div v-if="currentPreview" class="preview-wrap">
        <img :src="currentPreview" />
      </div>

      <div
        v-if="mode === 'camera' && !cameraActive && !currentPreview"
        class="placeholder"
      >
        <svg
          viewBox="0 0 48 48"
          width="48"
          height="48"
          fill="none"
          stroke="#555"
          stroke-width="2"
        >
          <rect x="4" y="14" width="40" height="26" rx="4" />
          <circle cx="24" cy="27" r="8" />
          <path d="M18 14l2-6h8l2 6" />
        </svg>
        <p>{{ cameraError || '点击下方按钮启动摄像头' }}</p>
        <button class="ph-btn" @click="startCamera">启动摄像头</button>
      </div>

      <div v-if="mode === 'screenshot' && !currentPreview" class="placeholder">
        <svg
          viewBox="0 0 48 48"
          width="48"
          height="48"
          fill="none"
          stroke="#555"
          stroke-width="2"
        >
          <rect x="4" y="6" width="40" height="28" rx="3" />
          <line x1="16" y1="40" x2="32" y2="40" />
          <line x1="24" y1="34" x2="24" y2="40" />
        </svg>
        <p>点击下方按钮截取屏幕</p>
      </div>

      <div v-if="countdown > 0" class="countdown">{{ countdown }}</div>
      <div v-if="flashOn" class="flash"></div>
    </div>

    <div class="controls">
      <template v-if="mode === 'camera'">
        <button v-if="currentPreview" class="ctrl-btn" @click="clearPreview">
          返回
        </button>
        <button
          class="ctrl-btn"
          @click="toggleMirror"
          :disabled="!cameraActive"
          title="翻转"
        >
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 10h14M3 10l4-4M3 10l4 4M17 10l-4-4M17 10l-4 4" />
          </svg>
        </button>
        <button
          class="shutter-btn"
          @click="takePhoto"
          :disabled="!cameraActive"
        >
          <span class="shutter-ring">
            <span class="shutter-dot"></span>
          </span>
        </button>
        <button
          class="ctrl-btn"
          @click="startCountdownTimer"
          :disabled="!cameraActive || countdown > 0"
          title="定时拍照"
        >
          {{ countdown > 0 ? countdown + 's' : '3s' }}
        </button>
      </template>
      <template v-if="mode === 'screenshot'">
        <button v-if="currentPreview" class="ctrl-btn" @click="clearPreview">
          新截图
        </button>
        <button
          class="ctrl-btn cap-btn"
          @click="captureScreen"
          :disabled="capturing"
        >
          {{ capturing ? '截取中...' : '截取屏幕' }}
        </button>
      </template>
      <button
        class="ctrl-btn save-btn"
        @click="saveCapture"
        :disabled="!currentPreview"
      >
        保存
      </button>
    </div>

    <div v-if="captures.length > 0" class="thumb-bar">
      <div
        v-for="(img, idx) in captures"
        :key="idx"
        class="thumb"
        :class="{ sel: selectedIdx === idx }"
        @click="selectCapture(idx)"
      >
        <img :src="img" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { System, BrowserWindow, Notify, join } from 'vtron';

const sys = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');

const mode = ref<'camera' | 'screenshot'>('camera');
const videoRef = ref<HTMLVideoElement>();
const mirrored = ref(true);
const cameraActive = ref(false);
const cameraError = ref('');
const countdown = ref(0);
const flashOn = ref(false);
const capturing = ref(false);

const currentPreview = ref('');
const captures = ref<string[]>([]);
const selectedIdx = ref(-1);

let stream: MediaStream | null = null;
let cdTimer = 0;

async function startCamera() {
  try {
    cameraError.value = '';
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    await nextTick();
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      cameraActive.value = true;
    }
  } catch (e: any) {
    cameraError.value =
      e?.name === 'NotAllowedError'
        ? '摄像头权限被拒绝'
        : e?.name === 'NotFoundError'
          ? '未检测到摄像头'
          : e?.message || '无法访问摄像头';
  }
}

function stopCamera() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  cameraActive.value = false;
}

function toggleMirror() {
  mirrored.value = !mirrored.value;
}

function doFlash() {
  flashOn.value = true;
  setTimeout(() => (flashOn.value = false), 200);
}

function takePhoto() {
  const v = videoRef.value;
  if (!v || !cameraActive.value) return;
  doFlash();

  const c = document.createElement('canvas');
  c.width = v.videoWidth;
  c.height = v.videoHeight;
  const g = c.getContext('2d')!;
  if (mirrored.value) {
    g.translate(c.width, 0);
    g.scale(-1, 1);
  }
  g.drawImage(v, 0, 0);
  addCapture(c.toDataURL('image/png'));
}

function startCountdownTimer() {
  if (!cameraActive.value || countdown.value > 0) return;
  countdown.value = 3;
  cdTimer = window.setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(cdTimer);
      takePhoto();
    }
  }, 1000);
}

async function captureScreen() {
  if (capturing.value) return;
  if (!navigator.mediaDevices?.getDisplayMedia) {
    new Notify({ title: '不支持', content: '当前浏览器不支持屏幕截图' });
    return;
  }
  capturing.value = true;
  try {
    const ds = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const v = document.createElement('video');
    v.srcObject = ds;
    v.muted = true;
    await new Promise<void>((r) => (v.onloadedmetadata = () => r()));
    await v.play();
    await new Promise((r) => setTimeout(r, 150));

    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')!.drawImage(v, 0, 0);
    ds.getTracks().forEach((t) => t.stop());
    addCapture(c.toDataURL('image/png'));
  } catch {
    /* user cancelled */
  }
  capturing.value = false;
}

function addCapture(url: string) {
  captures.value.unshift(url);
  if (captures.value.length > 20) captures.value.pop();
  currentPreview.value = url;
  selectedIdx.value = 0;
}

function clearPreview() {
  currentPreview.value = '';
  selectedIdx.value = -1;
}

function selectCapture(idx: number) {
  selectedIdx.value = idx;
  currentPreview.value = captures.value[idx];
}

async function saveCapture() {
  if (!currentPreview.value) return;
  const desktop = join(sys._options.userLocation || '/C/Users', 'Desktop');
  const label = mode.value === 'camera' ? '照片' : '截图';
  const path = join(desktop, `${label}_${Date.now()}.vtimg`);
  try {
    await sys.fs.writeFile(path, currentPreview.value);
    new Notify({ title: '保存成功', content: `已保存到 ${path}` });
  } catch (e: any) {
    new Notify({ title: '保存失败', content: e?.message || '' });
  }
}

function switchMode(m: 'camera' | 'screenshot') {
  mode.value = m;
  clearPreview();
  if (m === 'camera' && !cameraActive.value && !cameraError.value) {
    startCamera();
  }
}

onMounted(() => {
  startCamera();
});

onUnmounted(() => {
  stopCamera();
  if (cdTimer) clearInterval(cdTimer);
});
</script>

<style scoped>
.camera-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #111;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  user-select: none;
  overflow: hidden;
}

.mode-bar {
  display: flex;
  background: #0a0a0a;
  flex-shrink: 0;
}

.mode-bar button {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.mode-bar button:hover {
  color: #aaa;
}

.mode-bar button.active {
  color: #fff;
  border-bottom-color: #fff;
}

.main-view {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
}

.main-view video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.main-view video.mirrored {
  transform: scaleX(-1);
}

.preview-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.preview-wrap img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.placeholder {
  text-align: center;
  color: #666;
  padding: 32px;
}

.placeholder svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.placeholder p {
  margin-bottom: 16px;
  font-size: 14px;
}

.ph-btn {
  padding: 8px 20px;
  border: 1px solid #555;
  border-radius: 20px;
  background: transparent;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.ph-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.countdown {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 80px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  animation: cd-pop 1s ease-in-out;
  pointer-events: none;
}

@keyframes cd-pop {
  0% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.flash {
  position: absolute;
  inset: 0;
  background: #fff;
  pointer-events: none;
  animation: flash-out 0.2s ease-out forwards;
}

@keyframes flash-out {
  0% {
    opacity: 0.85;
  }
  100% {
    opacity: 0;
  }
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px;
  background: #111;
  flex-shrink: 0;
}

.ctrl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 16px;
  border: 1px solid #444;
  border-radius: 20px;
  background: transparent;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.ctrl-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.cap-btn {
  border-color: #42a5f5;
  color: #42a5f5;
}

.cap-btn:hover {
  background: rgba(66, 165, 245, 0.15);
}

.save-btn {
  border-color: #66bb6a;
  color: #66bb6a;
}

.save-btn:hover {
  background: rgba(102, 187, 106, 0.15);
}

.shutter-btn {
  width: 64px;
  height: 64px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.shutter-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.shutter-ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 3px solid #fff;
  transition: all 0.15s;
}

.shutter-btn:hover:not(:disabled) .shutter-ring {
  border-color: #ddd;
}

.shutter-dot {
  display: block;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #fff;
  transition: all 0.1s;
}

.shutter-btn:active:not(:disabled) .shutter-dot {
  transform: scale(0.85);
  background: #ccc;
}

.thumb-bar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #0a0a0a;
  overflow-x: auto;
  flex-shrink: 0;
}

.thumb {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.15s;
}

.thumb.sel {
  border-color: #fff;
}

.thumb:hover {
  border-color: #888;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
