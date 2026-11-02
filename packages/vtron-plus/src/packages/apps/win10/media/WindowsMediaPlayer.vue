<template>
  <Win10Frame
    title="Windows Media Player"
    :icon="win?.windowInfo.icon"
    background="#eaf2fa"
    titlebar-background="#fff"
  >
    <section
      ref="root"
      class="wmp"
      tabindex="0"
      @keydown="keyboard"
      @dragover.prevent
      @drop.prevent="dropFiles"
    >
      <div class="location">
        <button class="back" aria-label="返回媒体库" :disabled="!nowPlaying" @click="nowPlaying = false">
          <span class="mdl">&#xE72B;</span></button
        ><button disabled aria-label="前进"><span class="mdl">&#xE72A;</span></button
        ><span class="crumb">媒体库<span>›</span>{{ category }}<span>›</span>所有{{ category }}</span
        ><span class="space"></span>
        <div class="mode-tabs">
          <button class="active" @click="nowPlaying = false">播放</button><button disabled>刻录</button
          ><button disabled>同步</button>
        </div>
      </div>
      <div class="library-toolbar">
        <button @click="organize = !organize">组织⌄</button><button disabled>媒体流⌄</button
        ><button disabled>创建播放列表⌄</button><span class="space"></span
        ><input v-model="search" placeholder="搜索" aria-label="搜索媒体库" /><button
          disabled
          aria-label="帮助"
        >
          <span class="mdl">&#xE897;</span>
        </button>
        <div class="list-actions">
          <button disabled><span class="mdl">&#xE74E;</span>保存列表</button
          ><button :disabled="!tracks.length" @click="clearList">清除列表</button>
        </div>
      </div>
      <div class="library-body">
        <aside class="navigation">
          <button disabled><span class="mdl">&#xE77B;</span>媒体库</button
          ><button
            :class="{ selected: category === '播放列表' }"
            @click="
              category = '播放列表';
              nowPlaying = false;
            "
          >
            <span class="mdl">&#xE8F1;</span>播放列表</button
          ><button
            :class="{ selected: category === '音乐' }"
            @click="
              category = '音乐';
              nowPlaying = false;
            "
          >
            <span class="mdl">&#xE8D6;</span>音乐</button
          ><button class="sub" disabled>艺术家</button><button class="sub" disabled>专辑</button
          ><button class="sub" disabled>流派</button
          ><button
            :class="{ selected: category === '视频' }"
            @click="
              category = '视频';
              nowPlaying = false;
            "
          >
            <span class="mdl">&#xE714;</span>视频</button
          ><button disabled><span class="mdl">&#xE7C5;</span>图片</button>
          <div class="nav-gap"></div>
          <button disabled>其他媒体库</button>
        </aside>
        <main class="library-content">
          <p v-if="error && !nowPlaying" class="library-error">{{ error }}</p>
          <div v-show="!nowPlaying" class="library-table">
            <div class="table-head">
              <span>标题</span><span>长度</span><span>{{ category === '视频' ? '发行年份' : '艺术家' }}</span
              ><span>专辑</span>
            </div>
            <div v-if="visibleTracks.length" class="table-rows">
              <button
                v-for="track in visibleTracks"
                :key="track.id"
                :class="{ current: track.id === current?.id }"
                @dblclick="selectTrack(tracks.indexOf(track), true)"
                @click="selected = track.id"
              >
                <span class="track-name"
                  ><span class="mdl">{{ track.video ? '\uE714' : '\uE8D6' }}</span
                  >{{ track.name }}</span
                ><span>{{ track.id === current?.id && duration ? formatTime(duration) : '' }}</span
                ><span></span><span></span>
              </button>
            </div>
            <div v-else class="empty-library">
              <p>此媒体库中没有项目。</p>
              <p>单击“组织”，然后打开要播放的媒体文件。</p>
            </div>
          </div>
          <div v-show="nowPlaying" class="now-playing">
            <video
              ref="player"
              :src="source?.url"
              playsinline
              @loadedmetadata="metadata"
              @timeupdate="timeUpdated"
              @play="playing = true"
              @pause="playing = false"
              @ended="ended"
              @error="playbackError"
            ></video>
            <div v-if="current && !isVideo" class="audio-cover">
              <span class="mdl">&#xE8D6;</span><span>{{ current.name }}</span>
            </div>
            <p v-if="error" class="media-error">{{ error }}</p>
            <button
              class="return-library"
              title="切换到媒体库"
              aria-label="切换到媒体库"
              @click="nowPlaying = false"
            >
              <span class="mdl">&#xE8A9;</span>
            </button>
          </div>
        </main>
        <aside class="playlist">
          <div class="playlist-header"><span class="mdl">&#xE8F1;</span><span>未保存的列表</span></div>
          <div v-if="tracks.length" class="playlist-items">
            <button
              v-for="(track, index) in tracks"
              :key="track.id"
              :class="{ current: index === currentIndex }"
              @dblclick="selectTrack(index, true)"
              @click="selected = track.id"
            >
              <span class="mdl">{{ track.video ? '\uE714' : '\uE8D6' }}</span
              ><span>{{ track.name }}</span>
            </button>
          </div>
          <div v-else class="playlist-empty">
            <strong>将项目拖到此处</strong><span>以创建播放列表。</span
            ><button @click="localInput?.click()">打开文件…</button>
          </div>
          <footer>{{ tracks.length }} 个项目</footer>
        </aside>
      </div>
      <footer class="playback">
        <input
          class="progress"
          type="range"
          :value="elapsed"
          :max="duration || 1"
          min="0"
          step="0.1"
          :disabled="!duration"
          aria-label="播放进度"
          @input="seek"
        />
        <div class="track-info">
          <span>{{ current?.name || '' }}</span
          ><span>{{ current ? `${formatTime(elapsed)} / ${formatTime(duration)}` : '' }}</span>
        </div>
        <div class="transport">
          <button
            class="small"
            :class="{ enabled: shuffle }"
            :disabled="tracks.length < 2"
            title="无序播放"
            aria-label="无序播放"
            @click="shuffle = !shuffle"
          >
            <span class="mdl">&#xE8B1;</span></button
          ><button
            class="small"
            :class="{ enabled: repeat }"
            :disabled="!tracks.length"
            title="重复播放"
            aria-label="重复播放"
            @click="repeat = !repeat"
          >
            <span class="mdl">&#xE8EE;</span></button
          ><i></i
          ><button class="small" :disabled="!current" title="停止" aria-label="停止" @click="stop">
            <span class="mdl">&#xE71A;</span></button
          ><button class="skip" :disabled="!current" title="上一个" aria-label="上一个" @click="previous">
            <span class="mdl">&#xE892;</span></button
          ><button
            class="play-button"
            :disabled="!current || busy"
            :title="playing ? '暂停' : '播放'"
            :aria-label="playing ? '暂停' : '播放'"
            @click="togglePlay"
          >
            <span class="mdl">{{ playing ? '\uE769' : '\uE768' }}</span></button
          ><button
            class="skip"
            :disabled="tracks.length < 2"
            title="下一个"
            aria-label="下一个"
            @click="next"
          >
            <span class="mdl">&#xE893;</span></button
          ><button class="small volume-button" title="静音" aria-label="静音" @click="muted = !muted">
            <span class="mdl">{{ muted ? '\uE74F' : '\uE767' }}</span></button
          ><input
            v-model.number="volume"
            class="volume"
            aria-label="音量"
            type="range"
            min="0"
            max="1"
            step="0.01"
          />
        </div>
        <div class="playback-right">
          <button
            :disabled="!current"
            title="切换到正在播放"
            aria-label="切换到正在播放"
            @click="nowPlaying = !nowPlaying"
          >
            <span class="mdl">&#xE8A9;</span>
          </button>
        </div>
      </footer>
      <div v-if="organize" class="organize-menu">
        <button @click="open">打开文件(O)…</button
        ><button
          @click="
            localInput?.click();
            organize = false;
          "
        >
          从本机打开…
        </button>
        <hr />
        <button disabled>管理媒体库</button><button disabled>布局</button><button disabled>选项</button>
      </div>
      <input
        ref="localInput"
        type="file"
        accept="audio/*,video/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.mp4,.webm,.m4v,.mov"
        multiple
        hidden
        @change="localFiles"
      /><MediaPathDialog :state="prompt" @finish="finish" />
    </section>
  </Win10Frame>
</template>
<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { BrowserWindow, System, basename } from 'vtron';
import Win10Frame from '../../daily/Win10Frame.vue';
import MediaPathDialog from './MediaPathDialog.vue';
import {
  desktopPath,
  mediaPattern,
  message,
  type MediaSource,
  usePathPrompt,
  virtualMedia,
  virtualPath,
} from './mediaFiles';
type Track = { id: number; path: string; name: string; video: boolean; file?: File };
const sys = inject<System>('system')!,
  win = inject<BrowserWindow>('browserWindow');
const root = ref<HTMLElement>(),
  player = ref<HTMLVideoElement>(),
  localInput = ref<HTMLInputElement>();
const { prompt, ask, finish } = usePathPrompt();
const tracks = ref<Track[]>([]),
  currentIndex = ref(-1),
  source = ref<MediaSource | null>(null),
  selected = ref(-1),
  category = ref('音乐'),
  search = ref(''),
  organize = ref(false),
  nowPlaying = ref(false),
  playing = ref(false),
  busy = ref(false),
  shuffle = ref(false),
  repeat = ref(false),
  volume = ref(0.7),
  muted = ref(false),
  elapsed = ref(0),
  duration = ref(0),
  isVideo = ref(false),
  error = ref('');
let nextId = 0,
  loadVersion = 0;
const current = computed(() => tracks.value[currentIndex.value]);
const visibleTracks = computed(() =>
  tracks.value.filter(
    (track) =>
      (category.value === '播放列表' || (category.value === '视频' ? track.video : !track.video)) &&
      track.name.toLocaleLowerCase().includes(search.value.toLocaleLowerCase())
  )
);
watch([volume, muted], () => {
  if (player.value) {
    player.value.volume = volume.value;
    player.value.muted = muted.value;
  }
});
function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '00:00';
  const sec = Math.floor(value);
  return (
    (sec >= 3600 ? Math.floor(sec / 3600) + ':' : '') +
    String(Math.floor(sec / 60) % 60).padStart(2, '0') +
    ':' +
    String(sec % 60).padStart(2, '0')
  );
}
function metadata() {
  const element = player.value!;
  duration.value = Number.isFinite(element.duration) ? element.duration : 0;
  isVideo.value = element.videoWidth > 0;
  element.volume = volume.value;
  element.muted = muted.value;
}
function timeUpdated() {
  elapsed.value = player.value?.currentTime || 0;
}
function seek(event: Event) {
  if (player.value && duration.value)
    player.value.currentTime = Number((event.target as HTMLInputElement).value);
}
function playbackError() {
  if (source.value) error.value = '无法播放此文件。浏览器可能不支持其编码，或文件已损坏。';
  playing.value = false;
}
async function selectTrack(index: number, play = false) {
  const track = tracks.value[index];
  if (!track) return;
  const version = ++loadVersion;
  busy.value = true;
  error.value = '';
  try {
    player.value?.pause();
    const next = track.file
      ? {
          url: URL.createObjectURL(track.file),
          release() {
            URL.revokeObjectURL(this.url);
          },
        }
      : await virtualMedia(sys, track.path, 'media');
    if (version !== loadVersion) {
      next.release();
      return;
    }
    source.value?.release();
    source.value = next;
    currentIndex.value = index;
    selected.value = track.id;
    elapsed.value = 0;
    duration.value = 0;
    isVideo.value = track.video;
    category.value = track.video ? '视频' : '音乐';
    await nextTick();
    player.value?.load();
    if (play) await playMedia();
  } catch (reason) {
    await message('Windows Media Player', reason);
  } finally {
    if (version === loadVersion) busy.value = false;
  }
}
async function playMedia() {
  try {
    await player.value?.play();
  } catch {
    error.value = '无法开始播放，请再次单击播放，或选择受支持的媒体文件。';
  }
}
function togglePlay() {
  if (!current.value) return;
  if (playing.value) player.value?.pause();
  else void playMedia();
}
function stop() {
  player.value?.pause();
  if (player.value) player.value.currentTime = 0;
  elapsed.value = 0;
}
function previous() {
  if (!current.value) return;
  if ((player.value?.currentTime || 0) > 3) {
    player.value!.currentTime = 0;
    return;
  }
  const index = currentIndex.value > 0 ? currentIndex.value - 1 : repeat.value ? tracks.value.length - 1 : 0;
  void selectTrack(index, true);
}
function next() {
  if (!tracks.value.length) return;
  let index = currentIndex.value + 1;
  if (shuffle.value && tracks.value.length > 1) {
    const options = tracks.value.map((_, n) => n).filter((n) => n !== currentIndex.value);
    index = options[Math.floor(Math.random() * options.length)];
  }
  if (index >= tracks.value.length) {
    if (!repeat.value) {
      stop();
      return;
    }
    index = 0;
  }
  void selectTrack(index, true);
}
function ended() {
  if (currentIndex.value < tracks.value.length - 1 || repeat.value || shuffle.value) next();
  else playing.value = false;
}
function clearList() {
  loadVersion++;
  stop();
  source.value?.release();
  source.value = null;
  tracks.value = [];
  currentIndex.value = -1;
  error.value = '';
  duration.value = 0;
  busy.value = false;
  nowPlaying.value = false;
}
async function addVirtual(path: string) {
  if (!mediaPattern.test(path)) throw new Error('请选择受支持的音频或视频文件。');
  if (!(await sys.fs.stat(path))?.isFile) throw new Error('找不到媒体文件。');
  const track = { id: ++nextId, path, name: basename(path), video: /\.(mp4|webm|m4v|ogv|mov)$/i.test(path) };
  tracks.value.push(track);
  await selectTrack(tracks.value.length - 1);
}
async function open() {
  organize.value = false;
  const answer = await ask(
    '打开',
    current.value && !current.value.file ? current.value.path : desktopPath(sys, '音乐.mp3')
  );
  if (!answer?.trim()) return;
  try {
    await addVirtual(virtualPath(sys, answer));
  } catch (reason) {
    await message('Windows Media Player', reason);
  }
}
async function addFiles(files: File[]) {
  const supported = files.filter(
    (file) => /^(audio|video)\//.test(file.type) || mediaPattern.test(file.name)
  );
  if (!supported.length) return;
  const first = tracks.value.length;
  tracks.value.push(
    ...supported.map((file) => ({
      id: ++nextId,
      path: '',
      name: file.name,
      video: file.type.startsWith('video/') || /\.(mp4|webm|m4v|ogv|mov)$/i.test(file.name),
      file,
    }))
  );
  await selectTrack(first);
}
function localFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = '';
  void addFiles(files);
}
function dropFiles(event: DragEvent) {
  void addFiles(Array.from(event.dataTransfer?.files || []));
}
function keyboard(event: KeyboardEvent) {
  if (prompt.value || (event.target as Element).closest('input')) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') {
    event.preventDefault();
    void open();
  }
  if (event.code === 'Space' && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    togglePlay();
  }
  if (event.key === 'Escape') nowPlaying.value = false;
}
onMounted(async () => {
  root.value?.focus({ preventScroll: true });
  if (typeof win?.config.path === 'string') {
    try {
      await addVirtual(virtualPath(sys, win.config.path));
    } catch (reason) {
      await message('Windows Media Player', reason);
    }
  }
});
onUnmounted(() => {
  loadVersion++;
  player.value?.pause();
  source.value?.release();
});
</script>
<style scoped>
.wmp,
.wmp * {
  box-sizing: border-box;
}
.wmp {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  color: #1d2e44;
  background: linear-gradient(115deg, #eef5fb, #e3f0f8 55%, #f6f8fb);
  font:
    12px/1.35 'Segoe UI',
    'Microsoft YaHei UI',
    sans-serif;
  outline: 0;
  overflow: hidden;
}
button,
input {
  font: inherit;
  color: inherit;
  border-radius: 0;
}
button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid transparent;
  background: transparent;
  cursor: default;
  padding: 2px 7px;
}
button:hover:enabled {
  background: linear-gradient(#f1f8ff, #d5e7f8);
  border-color: #a0bbd7;
}
button:disabled {
  color: #98a3af;
}
button:focus-visible {
  outline: 1px dotted #607489;
  outline-offset: -3px;
}
.mdl {
  font: 14px/1 'SEGOEUIMDL';
}
.space {
  flex: 1;
  min-width: 2px;
}
.location {
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 3px 7px;
  gap: 3px;
  border-bottom: 1px solid #afc0d4;
  background: linear-gradient(#eff6fd, #deebf6);
}
.location > button {
  width: 26px;
  height: 26px;
  border: 1px solid #9eafbe;
  border-radius: 50%;
  padding: 0;
  box-shadow: inset 0 0 0 1px white;
  background: linear-gradient(#fff, #c1d5e7);
}
.location > button.back:enabled {
  background: linear-gradient(#82ccf8, #0b65b1);
  color: white;
}
.crumb {
  display: flex;
  gap: 9px;
  margin-left: 9px;
  white-space: nowrap;
}
.crumb span {
  color: #34495e;
}
.mode-tabs {
  display: flex;
  align-self: stretch;
  gap: 4px;
  margin-left: 10px;
}
.mode-tabs button {
  width: 78px;
  background: linear-gradient(#fff, #ecf3fa);
  border: 1px solid #bbc9d7;
  border-bottom: 0;
}
.mode-tabs button.active {
  background: #f4f8fc;
  position: relative;
  top: 1px;
}
.library-toolbar {
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #b8c8d8;
  background: linear-gradient(#f6faff, #e3edf8);
  padding: 0 7px;
  position: relative;
}
.library-toolbar > button {
  height: 25px;
  white-space: nowrap;
}
.library-toolbar > input {
  width: 210px;
  height: 23px;
  border: 1px solid #a8bacd;
  background: #fff;
  padding: 1px 7px;
  color: #444;
}
.list-actions {
  height: 32px;
  width: 250px;
  margin-left: 7px;
  display: flex;
  align-items: center;
  padding: 0 7px;
  gap: 10px;
  border-left: 1px solid #b8c8d8;
}
.list-actions button {
  white-space: nowrap;
  padding: 2px 0;
}
.library-body {
  display: flex;
  flex: 1;
  min-height: 0;
}
.navigation {
  width: 150px;
  flex-shrink: 0;
  padding: 17px 8px;
  border-right: 1px solid #d7e1ec;
  overflow: auto;
  user-select: none;
}
.navigation button {
  height: 23px;
  justify-content: flex-start;
  text-align: left;
  white-space: nowrap;
  width: 100%;
  padding: 1px 9px;
  gap: 7px;
}
.navigation .mdl {
  font-size: 13px;
  color: #64859d;
}
.navigation button.selected {
  background: #d0e5f8;
  border-color: #a9c7e3;
  color: #183e61;
}
.navigation button:disabled {
  color: #658099;
}
.navigation button.sub {
  padding-left: 43px;
  height: 21px;
}
.nav-gap {
  height: 18px;
}
.library-content {
  flex: 1;
  min-width: 0;
  position: relative;
  overflow: hidden;
}
.library-error {
  position: absolute;
  bottom: 20px;
  left: 15px;
  right: 15px;
  text-align: center;
  color: #a12222;
  z-index: 2;
}
.library-table {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.table-head,
.table-rows > button {
  display: grid;
  grid-template-columns: minmax(110px, 1.7fr) 75px minmax(70px, 1fr) minmax(60px, 1fr);
}
.table-head {
  height: 25px;
  flex-shrink: 0;
  color: #718193;
  background: #f5f8fb;
  border-bottom: 1px solid #dce5ee;
}
.table-head > span {
  padding: 5px 7px;
  border-right: 1px solid #dce5ee;
  white-space: nowrap;
  overflow: hidden;
}
.table-rows {
  overflow: auto;
  padding-top: 3px;
}
.table-rows > button {
  height: 29px;
  width: 100%;
  text-align: left;
  justify-content: stretch;
  padding: 0 2px;
  gap: 0;
}
.table-rows > button > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 5px;
}
.table-rows .track-name {
  display: flex;
  gap: 8px;
  align-items: center;
}
.current {
  background: #dceafa;
  border-color: #b3cce6;
}
.empty-library {
  padding: 70px 15px 20px;
  text-align: center;
  font-size: 12px;
  color: #222;
}
.empty-library p {
  margin: 3px 0;
}
.playlist {
  width: 250px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #f4f7fbea;
  border-left: 1px solid #b9c8d8;
  margin: 0 6px 6px 0;
  padding: 0 5px;
}
.playlist-header {
  height: 74px;
  flex-shrink: 0;
  display: flex;
  gap: 15px;
  align-items: center;
  border-bottom: 1px solid #d2dbe6;
  padding: 0 15px;
  color: #284969;
}
.playlist-header > .mdl {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 52px;
  background: linear-gradient(#fff, #dee7f1);
  border: 1px solid #afbdca;
  color: #388acc;
  font-size: 28px;
}
.playlist-items {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 5px 0;
}
.playlist-items > button {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
  width: 100%;
  height: 29px;
  padding: 0 6px;
  min-width: 0;
  gap: 7px;
}
.playlist-items > button > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.playlist-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #171717;
  gap: 3px;
  padding: 15px;
}
.playlist-empty strong {
  font-size: 12px;
  font-weight: 600;
}
.playlist-empty button {
  margin-top: 14px;
  color: #326690;
  text-decoration: underline;
}
.playlist footer {
  height: 23px;
  border-top: 1px solid #d5dde7;
  padding: 4px 6px;
  color: #626c77;
}
.now-playing {
  height: 100%;
  width: 100%;
  background: #060606;
  position: relative;
  color: white;
}
.now-playing video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.audio-cover {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 30px;
  pointer-events: none;
  text-align: center;
}
.audio-cover > .mdl {
  font-size: 80px;
  color: #68778c;
}
.audio-cover > span:last-child {
  font-size: 17px;
}
.media-error {
  position: absolute;
  inset: auto 15px 20px;
  text-align: center;
  color: #ddd;
  font-size: 12px;
}
.return-library {
  position: absolute;
  right: 10px;
  top: 10px;
  background: #0005;
  color: white;
}
.playback {
  height: 65px;
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(#edf5fc, #dce9f6);
  padding: 10px 13px 0;
}
.playback .progress {
  position: absolute;
  top: 0;
  left: 13px;
  width: calc(100% - 26px);
  height: 10px;
  margin: 0;
  accent-color: #83afcb;
}
.progress:disabled {
  opacity: 0.6;
}
.track-info {
  width: 190px;
  min-width: 30px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
  color: #586b7c;
  font-size: 11px;
}
.track-info span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.transport {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 37px;
  margin: auto;
  gap: 2px;
  padding: 0 8px;
  border: 1px solid #adbed1;
  box-shadow: inset 0 0 0 1px white;
  border-radius: 25px;
  background: linear-gradient(#f4faff, #d1e2f1);
}
.transport i {
  height: 25px;
  width: 1px;
  background: #afc0d0;
  margin: 0 6px;
}
.transport button {
  height: 28px;
  padding: 0;
  min-width: 26px;
  border-radius: 3px;
}
.transport .small .mdl {
  font-size: 13px;
  color: #267fb5;
}
.transport .small.enabled {
  background: #b9d9f6;
  border-color: #80add2;
}
.transport .skip {
  width: 40px;
  border: 1px solid #b8c7d6;
  background: linear-gradient(#fff, #bed4e8);
  border-radius: 5px;
}
.transport .skip .mdl {
  font-size: 20px;
  color: #5583aa;
}
.transport .play-button {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  min-width: 46px;
  background: radial-gradient(ellipse at 40% 15%, #d5efff, #409ed6 48%, #1c67a8 70%, #6baddb);
  border: 1px solid #567596;
  box-shadow:
    inset 0 0 0 2px #e1f2ff,
    0 0 0 2px #cbd9e8;
  color: white;
}
.play-button .mdl {
  font-size: 21px;
  text-shadow: 0 1px 1px #174b78;
}
.play-button:disabled {
  opacity: 0.5;
}
.transport .volume-button {
  margin-left: 7px;
}
.volume {
  width: 70px;
  height: 12px;
  accent-color: #3d91c9;
}
.playback-right {
  width: 190px;
  display: flex;
  justify-content: flex-end;
}
.playback-right button {
  width: 32px;
  height: 30px;
  color: #368dbe;
}
.organize-menu {
  position: absolute;
  z-index: 8;
  top: 67px;
  left: 7px;
  width: 225px;
  background: #f5f7fa;
  border: 1px solid #8fa8c2;
  box-shadow: 2px 3px 8px #0003;
  padding: 4px;
}
.organize-menu > button {
  width: 100%;
  height: 30px;
  justify-content: flex-start;
  padding-left: 20px;
}
.organize-menu hr {
  border: 0;
  border-top: 1px solid #ccd6e1;
  margin: 4px 0;
}
</style>
