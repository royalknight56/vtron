<template>
  <Win10Frame title="录音机" background="#f2f2f2" titlebar-background="#fff" :before-close="beforeClose">
    <div class="voice-recorder">
      <aside v-if="recordings.length" class="recordings-pane" aria-label="录音列表">
        <div class="list-heading">{{ groupHeading }}</div>
        <div class="recording-list">
          <button
            v-for="item in recordings"
            :key="item.id"
            class="recording-item"
            :class="{ selected: item.id === selectedId }"
            :disabled="active || saving"
            @click="selectRecording(item)"
          >
            <span class="recording-name">{{ item.name }}</span
            ><span class="recording-meta"
              ><span>{{ dateLabel(item.createdAt) }}</span
              ><span>{{ durationLabel(item.duration) }}</span></span
            >
          </button>
        </div>
        <div class="recording-list-footer">
          <button
            class="record-button"
            :disabled="!recordingSupported || requesting || saving || active"
            title="开始录音"
            aria-label="开始录音"
            @click="startRecording"
          >
            <span class="mdl" aria-hidden="true">&#xE720;</span>
          </button>
        </div>
      </aside>
      <section class="recorder-main" :class="{ 'empty-main': !recordings.length && !active }">
        <template v-if="active || saving">
          <div class="recording-time" role="timer" aria-label="录音时长">{{ timerLabel(elapsed) }}</div>
          <div class="capture-controls">
            <button
              class="stop-button"
              :disabled="saving"
              title="停止录音"
              aria-label="停止并保存录音"
              @click="stopRecording"
            >
              <span class="mdl" aria-hidden="true">&#xE71A;</span></button
            ><button
              class="round-control"
              :disabled="saving"
              :title="paused ? '继续录音' : '暂停录音'"
              :aria-label="paused ? '继续录音' : '暂停录音'"
              @click="toggleRecordingPause"
            >
              <span class="mdl" aria-hidden="true">{{ paused ? '\uE768' : '\uE769' }}</span></button
            ><button
              class="round-control"
              :disabled="saving"
              title="添加标记"
              aria-label="添加录音标记"
              @click="addMarker"
            >
              <span class="mdl" aria-hidden="true">&#xE7C1;</span>
            </button>
          </div>
          <div class="recording-state">{{ saving ? '正在保存…' : paused ? '已暂停' : '正在录音' }}</div>
          <div v-if="currentMarkers.length" class="capture-markers">
            <span v-for="(marker, index) in currentMarkers" :key="index"
              ><span class="mdl" aria-hidden="true">&#xE7C1;</span>{{ durationLabel(marker) }}</span
            >
          </div>
        </template>
        <template v-else-if="selected">
          <header class="playback-heading">
            <span class="selected-name">{{ selected.name }}</span
            ><span>{{ dateLabel(selected.createdAt) }}</span>
          </header>
          <div class="marker-strip">
            <button
              v-for="(marker, index) in selected.markers"
              :key="index"
              :disabled="loadingAudio"
              :title="`跳到 ${durationLabel(marker)}`"
              @click="seek(marker)"
            >
              <span class="mdl" aria-hidden="true">&#xE7C1;</span>{{ durationLabel(marker) }}
            </button>
          </div>
          <button
            class="play-button"
            :disabled="loadingAudio || !audioUrl"
            :aria-label="playing ? '暂停播放' : '播放录音'"
            :title="playing ? '暂停播放' : '播放录音'"
            @click="togglePlayback"
          >
            <span class="mdl" aria-hidden="true">{{ playing ? '\uE769' : '\uE768' }}</span>
          </button>
          <button
            class="playback-marker"
            :disabled="loadingAudio || !audioUrl"
            title="添加标记"
            aria-label="添加播放标记"
            @click="addPlaybackMarker"
          >
            <span class="mdl" aria-hidden="true">&#xE7C1;</span>
          </button>
          <div class="playback-progress">
            <span>{{ durationLabel(playbackTime) }}</span
            ><input
              type="range"
              min="0"
              :max="selected.duration || 1"
              step="0.01"
              :value="playbackTime"
              :disabled="loadingAudio || !audioUrl"
              aria-label="播放进度"
              @input="seek(Number(($event.target as HTMLInputElement).value))"
            /><span>{{ durationLabel(selected.duration) }}</span>
          </div>
          <footer class="playback-actions">
            <button disabled title="共享" aria-label="共享录音">
              <span class="mdl" aria-hidden="true">&#xE72D;</span></button
            ><button disabled title="修剪" aria-label="修剪录音">
              <span class="mdl" aria-hidden="true">&#xE78A;</span></button
            ><button disabled title="删除" aria-label="删除录音">
              <span class="mdl" aria-hidden="true">&#xE74D;</span></button
            ><button :disabled="loadingAudio" title="重命名" aria-label="重命名录音" @click="renameRecording">
              <span class="mdl" aria-hidden="true">&#xE70F;</span></button
            ><button
              :disabled="loadingAudio || !audioUrl"
              title="另存为"
              aria-label="下载录音"
              @click="downloadRecording"
            >
              <span class="mdl" aria-hidden="true">&#xE74E;</span></button
            ><button disabled title="更多" aria-label="更多操作">
              <span class="mdl" aria-hidden="true">&#xE712;</span>
            </button>
          </footer>
        </template>
        <template v-else>
          <button
            class="record-button empty-record"
            :disabled="!recordingSupported || requesting"
            title="开始录音"
            aria-label="开始录音"
            @click="startRecording"
          >
            <span class="mdl" aria-hidden="true">&#xE720;</span>
          </button>
          <div v-if="requesting || !recordingSupported" class="empty-label" role="status">
            {{ requesting ? '正在等待麦克风权限…' : '当前浏览器不支持录音' }}
          </div>
          <footer class="empty-footer">
            <button disabled title="更多" aria-label="更多操作">
              <span class="mdl" aria-hidden="true">&#xE712;</span>
            </button>
          </footer>
        </template>
        <p v-if="message" class="status-message" :class="{ error: messageIsError }" role="status">
          {{ message }}
        </p>
      </section>
      <div v-if="renameOpen" class="rename-backdrop" @keydown.esc.stop="!renaming && (renameOpen = false)">
        <form
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-title"
          class="rename-dialog"
          @submit.prevent="confirmRename"
        >
          <h2 id="rename-title">重命名</h2>
          <label for="recording-name">录音名称</label
          ><input
            id="recording-name"
            ref="renameInput"
            v-model="renameValue"
            maxlength="120"
            :disabled="renaming"
          />
          <div>
            <button type="submit" :disabled="renaming || !renameValue.trim()">确定</button
            ><button type="button" :disabled="renaming" @click="renameOpen = false">取消</button>
          </div>
        </form>
      </div>
      <audio
        ref="audioRef"
        :src="audioUrl || undefined"
        @timeupdate="onTimeUpdate"
        @ended="playing = false"
        @pause="playing = false"
        @play="playing = true"
        @error="onAudioError"
      ></audio>
    </div>
  </Win10Frame>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { Dialog, System } from 'vtron';
import Win10Frame from './Win10Frame.vue';
interface Recording {
  id: string;
  name: string;
  path: string;
  createdAt: number;
  duration: number;
  mime: string;
  encoding: 'binary' | 'base64';
  markers: number[];
}
const system = inject<System>('system')!;
const directory = `${system._options.userLocation || '/C/Users/'}Music/录音`;
const metadataPath = `${directory}/.recordings.json`;
const recordingSupported = !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
const recordings = ref<Recording[]>([]);
const selectedId = ref('');
const selected = computed(() => recordings.value.find((item) => item.id === selectedId.value));
const groupHeading = '录音';
const active = ref(false);
const paused = ref(false);
const requesting = ref(false);
const saving = ref(false);
const elapsed = ref(0);
const currentMarkers = ref<number[]>([]);
const message = ref('');
const renameOpen = ref(false);
const renameValue = ref('');
const renaming = ref(false);
const renameInput = ref<HTMLInputElement>();
const messageIsError = ref(false);
const audioRef = ref<HTMLAudioElement>();
const audioUrl = ref('');
const playing = ref(false);
const playbackTime = ref(0);
const loadingAudio = ref(false);
let recorder: MediaRecorder | undefined;
let stream: MediaStream | undefined;
let chunks: Blob[] = [];
let elapsedBeforePause = 0;
let segmentStartedAt = 0;
let clock: ReturnType<typeof setInterval> | undefined;
let disposed = false;
let operationVersion = 0;
let finishRecording: (() => void) | undefined;
let stopping: Promise<void> | undefined;
function report(text: string, error = false) {
  message.value = text;
  messageIsError.value = error;
}
function durationLabel(seconds: number) {
  const n = Math.max(0, Math.floor(seconds));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}
function timerLabel(seconds: number) {
  const n = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(n / 3600)).padStart(2, '0')}:${String(Math.floor(n / 60) % 60).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
}
function dateLabel(value: number) {
  const date = new Date(value);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
function updateElapsed() {
  elapsed.value =
    elapsedBeforePause + (active.value && !paused.value ? (performance.now() - segmentStartedAt) / 1000 : 0);
}
function stopTracks() {
  stream?.getTracks().forEach((track) => track.stop());
  stream = undefined;
}
function stopClock() {
  clearInterval(clock);
  clock = undefined;
}
function releaseAudio() {
  audioRef.value?.pause();
  if (audioRef.value) audioRef.value.removeAttribute('src');
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
  audioUrl.value = '';
  playing.value = false;
  playbackTime.value = 0;
}
async function ensureDirectory() {
  const music = directory.slice(0, directory.lastIndexOf('/'));
  if (!(await system.fs.exists(music))) await system.fs.mkdir(music);
  if (!(await system.fs.exists(directory))) await system.fs.mkdir(directory);
}
async function saveMetadata() {
  await system.fs.writeFile(metadataPath, JSON.stringify(recordings.value));
}
function toBase64(bytes: Uint8Array) {
  let value = '';
  for (let i = 0; i < bytes.length; i += 8192) value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value);
}
async function loadRecordings() {
  try {
    const text = await system.fs.readFile(metadataPath);
    const parsed: unknown = text ? JSON.parse(text) : [];
    if (!Array.isArray(parsed)) return;
    const valid = parsed.filter(
      (value): value is Recording =>
        value &&
        typeof value.id === 'string' &&
        typeof value.path === 'string' &&
        value.path.startsWith(directory + '/') &&
        !value.path.slice(directory.length + 1).includes('/') &&
        typeof value.name === 'string' &&
        Number.isFinite(value.createdAt) &&
        Number.isFinite(value.duration) &&
        value.duration >= 0 &&
        typeof value.mime === 'string' &&
        ['binary', 'base64'].includes(value.encoding)
    );
    recordings.value = valid
      .map((item) => ({
        ...item,
        markers: Array.isArray(item.markers)
          ? item.markers.filter((value) => Number.isFinite(value) && value >= 0 && value <= item.duration)
          : [],
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
    if (recordings.value[0]) await selectRecording(recordings.value[0]);
  } catch {
    report('无法读取已有录音。', true);
  }
}
async function selectRecording(item: Recording, allowSaving = false) {
  if (active.value || (saving.value && !allowSaving)) return;
  const version = ++operationVersion;
  releaseAudio();
  selectedId.value = item.id;
  loadingAudio.value = true;
  report('');
  try {
    let bytes: Uint8Array | null = null;
    if (item.encoding === 'binary' && system.fs.readBinaryFile)
      bytes = await system.fs.readBinaryFile(item.path);
    else {
      const text = await system.fs.readFile(item.path);
      if (text !== null) bytes = Uint8Array.from(atob(text), (character) => character.charCodeAt(0));
    }
    if (!bytes) throw new Error('录音文件不存在。');
    if (disposed || version !== operationVersion) return;
    audioUrl.value = URL.createObjectURL(new Blob([bytes], { type: item.mime }));
    await nextTick();
    audioRef.value?.load();
  } catch {
    if (!disposed && version === operationVersion) report('无法读取录音文件。', true);
  } finally {
    if (version === operationVersion) loadingAudio.value = false;
  }
}
async function persistRecording(blob: Blob, duration: number, markers: number[]) {
  await ensureDirectory();
  const id = `${Date.now()}-${crypto.randomUUID()}`;
  const mime = blob.type || 'audio/webm';
  const extension = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
  const path = `${directory}/${id}.${extension}`;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const encoding = system.fs.writeBinaryFile ? 'binary' : 'base64';
  if (system.fs.writeBinaryFile) await system.fs.writeBinaryFile(path, bytes, { flag: 'wx' });
  else await system.fs.writeFile(path, toBase64(bytes), { flag: 'wx' });
  let index = 1;
  while (recordings.value.some((item) => item.name === `录音 (${index})`)) index++;
  const item: Recording = {
    id,
    name: `录音 (${index})`,
    path,
    createdAt: Date.now(),
    duration,
    mime,
    encoding,
    markers,
  };
  recordings.value = [item, ...recordings.value];
  await saveMetadata();
  system.refershApp();
  return item;
}
async function startRecording() {
  if (!recordingSupported || requesting.value || active.value || saving.value) return;
  report('');
  ++operationVersion;
  loadingAudio.value = false;
  requesting.value = true;
  releaseAudio();
  try {
    const selectedStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    if (disposed) {
      selectedStream.getTracks().forEach((track) => track.stop());
      return;
    }
    stream = selectedStream;
    const supportedMime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find((type) =>
      MediaRecorder.isTypeSupported(type)
    );
    recorder = supportedMime
      ? new MediaRecorder(selectedStream, { mimeType: supportedMime })
      : new MediaRecorder(selectedStream);
    chunks = [];
    elapsed.value = 0;
    elapsedBeforePause = 0;
    currentMarkers.value = [];
    paused.value = false;
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onerror = () => {
      report('录音过程中发生错误。', true);
      void stopRecording();
    };
    recorder.onstop = async () => {
      if (!stopping)
        stopping = new Promise<void>((resolve) => {
          finishRecording = resolve;
        });
      updateElapsed();
      const duration = elapsed.value;
      const markers = [...currentMarkers.value];
      const mime = recorder?.mimeType || supportedMime || 'audio/webm';
      active.value = false;
      paused.value = false;
      saving.value = true;
      stopClock();
      stopTracks();
      try {
        const blob = new Blob(chunks, { type: mime });
        if (blob.size) {
          const item = await persistRecording(blob, duration, markers);
          if (!disposed) await selectRecording(item, true);
        } else if (!disposed) report('录音没有生成音频数据。', true);
      } catch {
        if (!disposed) report('录音保存失败，请检查存储空间或写入权限。', true);
      } finally {
        saving.value = false;
        recorder = undefined;
        chunks = [];
        finishRecording?.();
        finishRecording = undefined;
        stopping = undefined;
      }
    };
    segmentStartedAt = performance.now();
    active.value = true;
    recorder.start(250);
    clock = setInterval(updateElapsed, 100);
    selectedStream.getAudioTracks().forEach((track) =>
      track.addEventListener(
        'ended',
        () => {
          if (active.value) void stopRecording();
        },
        { once: true }
      )
    );
  } catch (error) {
    active.value = false;
    stopClock();
    stopTracks();
    report(
      error instanceof DOMException && error.name === 'NotAllowedError'
        ? '未授予麦克风权限。'
        : error instanceof DOMException && error.name === 'NotFoundError'
          ? '未检测到麦克风。'
          : '无法启动录音，请检查麦克风。',
      true
    );
  } finally {
    requesting.value = false;
  }
}
function toggleRecordingPause() {
  if (!recorder || !active.value || saving.value) return;
  if (paused.value) {
    segmentStartedAt = performance.now();
    paused.value = false;
    recorder.resume();
  } else {
    updateElapsed();
    elapsedBeforePause = elapsed.value;
    paused.value = true;
    recorder.pause();
  }
}
function stopRecording(): Promise<void> {
  if (stopping) return stopping;
  if (!recorder || recorder.state === 'inactive') return Promise.resolve();
  updateElapsed();
  elapsedBeforePause = elapsed.value;
  segmentStartedAt = performance.now();
  stopping = new Promise<void>((resolve) => {
    finishRecording = resolve;
  });
  recorder.stop();
  return stopping;
}
function addMarker() {
  updateElapsed();
  currentMarkers.value = [...currentMarkers.value, elapsed.value];
}
function onTimeUpdate() {
  playbackTime.value = audioRef.value?.currentTime || 0;
}
function onAudioError() {
  if (audioUrl.value) report('浏览器无法播放此录音格式。', true);
  playing.value = false;
}
function seek(time: number) {
  if (!audioRef.value || !selected.value) return;
  const value = Math.max(0, Math.min(selected.value.duration, time));
  try {
    audioRef.value.currentTime = value;
    playbackTime.value = value;
  } catch {
    report('暂时无法跳转，请稍后重试。', true);
  }
}
async function togglePlayback() {
  if (!audioRef.value || !audioUrl.value) return;
  if (playing.value) audioRef.value.pause();
  else
    try {
      await audioRef.value.play();
    } catch {
      report('无法播放录音，请重试。', true);
    }
}
async function addPlaybackMarker() {
  if (!selected.value) return;
  const marker = playbackTime.value;
  selected.value.markers = [...selected.value.markers, marker].sort((a, b) => a - b);
  try {
    await saveMetadata();
  } catch {
    report('标记保存失败。', true);
  }
}
async function renameRecording() {
  const item = selected.value;
  if (!item) return;
  renameValue.value = item.name;
  renameOpen.value = true;
  await nextTick();
  renameInput.value?.focus();
  renameInput.value?.select();
}
async function confirmRename() {
  const item = selected.value;
  const name = renameValue.value.trim();
  if (!item || !name || renaming.value) return;
  renaming.value = true;
  const previous = item.name;
  item.name = name;
  try {
    await saveMetadata();
    renameOpen.value = false;
  } catch {
    item.name = previous;
    report('名称保存失败。', true);
  } finally {
    renaming.value = false;
  }
}

function downloadRecording() {
  if (!selected.value || !audioUrl.value) return;
  const extension = selected.value.path.split('.').pop() || 'webm';
  const link = document.createElement('a');
  link.href = audioUrl.value;
  link.download = selected.value.name.replace(/[\\/:*?"<>|]/g, '_') + '.' + extension;
  link.click();
}
async function beforeClose() {
  if (!active.value && !saving.value) return true;
  const answer = await Dialog.showMessageBox({
    title: '录音机',
    message: '停止录音并保存后关闭？',
    type: 'question',
    buttons: ['停止并保存', '取消'],
  });
  if (answer.response !== 0) return false;
  await stopRecording();
  return true;
}
onMounted(() => {
  void loadRecordings();
});
onUnmounted(() => {
  disposed = true;
  ++operationVersion;
  stopClock();
  if (recorder && recorder.state !== 'inactive') {
    recorder.onstop = null;
    recorder.ondataavailable = null;
    recorder.stop();
  }
  stopTracks();
  releaseAudio();
  finishRecording?.();
  finishRecording = undefined;
});
</script>

<style scoped>
.voice-recorder {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  font:
    13px/1.4 'Segoe UI',
    'Microsoft YaHei UI',
    sans-serif;
  color: #111;
  background: #f2f2f2;
  user-select: none;
}
.voice-recorder * {
  box-sizing: border-box;
}
button,
input {
  font: inherit;
}
button {
  color: inherit;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 0;
  padding: 0;
  cursor: default;
}
button:hover:enabled {
  background: #ddd;
}
button:disabled {
  color: #999;
}
button:focus-visible {
  outline: 2px solid #0078d7;
  outline-offset: -3px;
}
.mdl {
  font: 20px/1 'SEGOEUIMDL';
}
.recordings-pane {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 272px;
  min-height: 0;
  background: #fafafa;
  border-right: 1px solid #e7e7e7;
}
.list-heading {
  flex-shrink: 0;
  height: 42px;
  padding: 13px 12px 8px;
  font-size: 14px;
}
.recording-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.recording-item {
  display: block;
  position: relative;
  width: 100%;
  height: 65px;
  padding: 10px 12px;
  text-align: left;
  border: 0;
  border-left: 3px solid transparent;
}
.recording-item.selected {
  background: #dedede;
  border-left-color: #0078d7;
}
.recording-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}
.recording-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
  font-size: 12px;
}
.recording-list-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 90px;
  flex-shrink: 0;
}
.record-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: #0078d7;
}
.record-button .mdl {
  font-size: 28px;
}
.record-button:hover:enabled {
  background: #006cbe;
}
.record-button:disabled {
  color: #ccc;
  background: #a5a5a5;
}
.recorder-main {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-height: 0;
  min-width: 0;
  padding: 16px 16px 0;
  background: #f2f2f2;
}
.empty-main {
  justify-content: center;
  padding: 0;
  background: #e6e6e6;
}
.empty-record {
  width: 96px;
  height: 96px;
}
.empty-record .mdl {
  font-size: 36px;
}
.empty-label {
  position: absolute;
  top: calc(50% + 72px);
  left: 16px;
  right: 16px;
  color: #555;
  font-size: 15px;
  text-align: center;
}
.empty-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 24px;
  display: flex;
  justify-content: flex-end;
  background: #f2f2f2;
}
.empty-footer button {
  width: 48px;
  height: 24px;
}
.empty-footer button:disabled {
  color: #111;
  opacity: 0.45;
}
.empty-main .status-message {
  position: absolute;
  bottom: 42px;
  left: 16px;
  right: 16px;
}
.playback-heading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding-top: 0;
  text-align: center;
  width: 100%;
}
.selected-name {
  font-size: 15px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.playback-heading > span:last-child {
  color: #666;
  font-size: 12px;
}
.marker-strip {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2px;
  min-height: 40px;
  padding-top: 17px;
  width: 100%;
}
.marker-strip button {
  padding: 5px;
  font-size: 12px;
}
.marker-strip .mdl {
  font-size: 12px;
  color: #0078d7;
  margin-right: 3px;
}
.play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  margin: auto 0 22px;
  background: #e5e5e5;
}
.play-button .mdl {
  font-size: 33px;
}
.playback-marker {
  width: 36px;
  height: 36px;
  margin-bottom: 14px;
}
.playback-marker .mdl {
  font-size: 20px;
}
.playback-progress {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  margin: 5px 0 30px;
  font-size: 12px;
}
.playback-progress input {
  min-width: 0;
  flex: 1;
  accent-color: #0078d7;
  height: 3px;
  cursor: default;
}
.playback-actions {
  display: flex;
  justify-content: space-between;
  gap: 5px;
  width: 100%;
  flex-shrink: 0;
  height: 46px;
}
.playback-actions button {
  width: 36px;
  height: 36px;
}
.playback-actions .mdl {
  font-size: 20px;
}
.recording-time {
  margin: auto 0 36px;
  font-size: 44px;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
}
.capture-controls {
  display: flex;
  align-items: center;
  gap: 22px;
}
.stop-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 84px;
  border: 0;
  border-radius: 50%;
  background: #0078d7;
  color: #fff;
}
.stop-button:hover:enabled {
  background: #006cbe;
}
.stop-button .mdl {
  font-size: 32px;
}
.round-control {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid #999;
}
.round-control .mdl {
  font-size: 18px;
}
.recording-state {
  margin-top: 20px;
  color: #666;
}
.capture-markers {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  min-height: 30px;
  margin: 25px 0 auto;
  color: #555;
  font-size: 12px;
}
.capture-markers .mdl {
  color: #0078d7;
  font-size: 12px;
  margin-right: 4px;
}
.status-message {
  flex-shrink: 0;
  margin: 12px 0 6px;
  max-width: 100%;
  color: #555;
  overflow-wrap: anywhere;
  font-size: 12px;
  text-align: center;
}
.status-message.error {
  color: #a4262c;
}
audio {
  display: none;
}
@media (max-width: 650px) {
  .recordings-pane {
    width: 220px;
  }
  .playback-progress {
    gap: 8px;
  }
  .capture-controls {
    gap: 12px;
  }
  .recording-time {
    font-size: 34px;
  }
}
.rename-backdrop {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0002;
}
.rename-dialog {
  width: 320px;
  max-width: calc(100% - 32px);
  padding: 20px;
  border: 1px solid #999;
  background: #f2f2f2;
  box-shadow: 0 4px 18px #0003;
}
.rename-dialog h2 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 400;
}
.rename-dialog label {
  display: block;
  margin-bottom: 6px;
}
.rename-dialog input {
  width: 100%;
  height: 30px;
  padding: 4px 7px;
  border: 1px solid #888;
  border-radius: 0;
}
.rename-dialog > div {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 22px;
}
.rename-dialog button {
  min-width: 76px;
  height: 28px;
  border: 1px solid #adadad;
  background: #e1e1e1;
}
</style>
