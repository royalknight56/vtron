<template>
  <div class="video-editor" @keydown.esc.stop="onEscape">
    <template v-if="!project">
      <header class="video-toolbar">
        <button type="button" @click="emit('close')"><span class="mdl">&#xE72B;</span>返回照片</button>
        <h1>{{ photoPath ? '添加到创作' : '视频项目' }}</h1>
        <button type="button" class="accent" @click="createProject"><span class="mdl">&#xE710;</span>新建视频项目</button>
      </header>
      <div class="project-list">
        <p v-if="loading">正在加载项目…</p>
        <p v-else-if="!projects.length">没有视频项目</p>
        <button
          v-for="entry in projects"
          :key="entry.project.id"
          type="button"
          class="project-tile"
          @click="openProject(entry)"
        >
          <span class="project-thumbnail"><span class="mdl">&#xE714;</span></span>
          <strong>{{ entry.project.name }}</strong>
          <span>{{ photoPath ? '添加到此项目' : `${entry.project.clips.length} 个片段` }}</span>
        </button>
      </div>
    </template>
    <template v-else>
      <header class="video-toolbar">
        <button type="button" :disabled="saving" @click="backToProjects"><span class="mdl">&#xE72B;</span>视频项目</button>
        <input v-model="project.name" maxlength="100" aria-label="项目名称" placeholder="项目名称" :disabled="saving" />
        <div class="toolbar-spacer"></div>
        <div class="music-control">
          <button
            type="button"
            :disabled="playing || saving || importingMusic"
            :aria-expanded="musicMenu"
            @click="musicMenu = !musicMenu"
          >
            <span class="mdl">&#xE8D6;</span>{{ importingMusic ? '正在导入音乐…' : '背景音乐' }}
          </button>
          <div v-if="musicMenu" class="music-menu">
            <button type="button" @click="chooseVirtualMusic">打开 Vtron 音频</button>
            <button type="button" @click="musicInput?.click()">从本机导入</button>
            <button v-if="project.music" type="button" @click="setMusic(null)">移除背景音乐</button>
          </div>
        </div>
        <button type="button" class="accent" :disabled="saving || importingMusic || !project.name.trim() || !dirty" @click="save">
          {{ saving ? '正在保存…' : '保存项目' }}
        </button>
      </header>

      <div class="project-workspace">
        <section class="project-library" aria-label="项目库">
          <h2>项目库</h2>
          <div v-if="libraryPhotos.length" class="asset-grid">
            <button
              v-for="asset in libraryPhotos"
              :key="asset"
              type="button"
              class="asset-tile"
              :title="basename(asset)"
              :aria-label="'添加 ' + basename(asset)"
              :disabled="playing || saving"
              @click="addPhoto(asset)"
            >
              <img v-if="images[asset]" :src="images[asset]" alt="" @error="markImageUnavailable(asset)" />
              <span v-else class="asset-placeholder mdl">&#xEB9F;</span>
              <span>{{ basename(asset) }}</span>
            </button>
          </div>
          <p v-else class="empty">没有可添加的照片</p>
        </section>

        <section class="preview-panel" aria-label="预览">
          <div class="preview">
            <img
              v-if="previewClip?.kind === 'photo' && images[previewClip.path]"
              :src="images[previewClip.path]"
              :alt="basename(previewClip.path)"
              @error="markImageUnavailable(previewClip.path)"
            />
            <strong v-else-if="previewClip?.kind === 'title'" class="preview-title">{{ previewClip.text }}</strong>
            <p v-else-if="previewClip?.kind === 'photo' && unavailable.has(previewClip.path)">照片不可用</p>
            <p v-else-if="previewClip?.kind === 'photo'">正在加载照片…</p>
            <p v-else>没有可预览的片段</p>
          </div>
          <div class="playback">
            <button
              type="button"
              :disabled="!project.clips.length || saving || loadingMusic || importingMusic"
              @click="togglePreview"
            >
              <span class="mdl">{{ playing ? '\uE71A' : '\uE768' }}</span>{{ playing ? '停止预览' : '播放预览' }}
            </button>
            <span class="playback-time">{{ formatTime(previewTime) }} / {{ formatTime(totalTime) }}</span>
            <span v-if="musicLabel" class="music-name" :title="musicLabel">{{ musicLabel }}</span>
          </div>
        </section>
      </div>

      <section class="storyboard" aria-label="故事板">
        <header class="story-toolbar">
          <h2>故事板</h2>
          <button type="button" :disabled="playing || saving" @click="addTitle">添加标题卡</button>
          <label v-if="selectedClip">
            持续时间（秒）
            <input
              type="number"
              min="0.1"
              max="60"
              step="0.1"
              :value="selectedClip.duration"
              :disabled="playing || saving"
              @input="updateDuration"
              @change="setDuration"
              @blur="setDuration"
            />
          </label>
          <button
            v-if="selectedClip"
            type="button"
            aria-label="左移片段"
            title="左移片段"
            :disabled="selectedIndex <= 0 || playing || saving"
            @click="moveClip(selectedIndex, selectedIndex - 1)"
          >←</button>
          <button
            v-if="selectedClip"
            type="button"
            aria-label="右移片段"
            title="右移片段"
            :disabled="selectedIndex >= project.clips.length - 1 || playing || saving"
            @click="moveClip(selectedIndex, selectedIndex + 1)"
          >→</button>
          <button v-if="selectedClip" type="button" :disabled="playing || saving" @click="removeClip">移除片段</button>
        </header>
        <label v-if="selectedClip?.kind === 'title'" class="title-card-field">
          标题文字
          <input v-model="selectedClip.text" maxlength="100" :disabled="playing || saving" />
        </label>
        <div v-if="project.clips.length" class="story-track">
          <button
            v-for="(clip, index) in project.clips"
            :key="clip.id"
            type="button"
            class="story-tile"
            :class="{ selected: (playing ? playingIndex : selectedIndex) === index, 'drop-target': dropIndex === index }"
            :draggable="!playing && !saving"
            :aria-pressed="selectedIndex === index"
            :title="clip.kind === 'photo' ? basename(clip.path) : clip.text"
            @click="selectedIndex = index"
            @dragstart="startDrag(index, $event)"
            @dragover="dragOver(index, $event)"
            @drop="dropClip(index, $event)"
            @dragend="clearDrag"
          >
            <img
              v-if="clip.kind === 'photo' && images[clip.path]"
              :src="images[clip.path]"
              alt=""
              draggable="false"
              @error="markImageUnavailable(clip.path)"
            />
            <span v-else-if="clip.kind === 'title'" class="card-thumb">{{ clip.text }}</span>
            <span v-else class="asset-placeholder mdl">&#xEB9F;</span>
            <span class="clip-caption">
              <span>{{ clip.kind === 'photo' ? basename(clip.path) : '标题卡' }}</span>
              <span>{{ clip.duration }} 秒</span>
            </span>
          </button>
        </div>
        <p v-else class="empty">从项目库添加照片，或添加标题卡</p>
      </section>
      <input
        ref="musicInput"
        type="file"
        :accept="audioExtensions.join(',')"
        hidden
        @change="importMusic"
      />
      <audio ref="audio" :src="musicSource?.url" preload="auto" loop @error="audioError" />
    </template>
    <p v-if="feedback" class="feedback" role="status">{{ feedback }}</p>
    <MediaPathDialog :state="prompt" @finish="finish" />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import { basename, Dialog, dirname, join, type System } from 'vtron';
import MediaPathDialog from './MediaPathDialog.vue';
import { imagePattern, type MediaSource, usePathPrompt, virtualMedia, virtualPath } from './mediaFiles';

type Clip =
  | { id: string; kind: 'photo'; path: string; duration: number }
  | { id: string; kind: 'title'; text: string; duration: number };
type Project = {
  version: 1;
  id: string;
  name: string;
  clips: Clip[];
  music: string | null;
};
type SavedProject = { project: Project; contents: string; mtime: number };

const props = defineProps<{ library: string; photoPath: string; newProject?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const sys = inject<System>('system')!;
const directory = join(dirname(props.library), 'Video Projects');
const musicDirectory = join(directory, 'Music');
const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
const audioPattern = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;

const projects = ref<SavedProject[]>([]);
const project = ref<Project>();
const savedContents = ref('');
const saving = ref(false);
const loading = ref(false);
const feedback = ref('');
const libraryPhotos = ref<string[]>([]);
const images = ref<Record<string, string>>({});
const unavailable = ref(new Set<string>());
const imageSources = new Map<string, MediaSource>();
let disposed = false;
let readingLibrary = false;
const selectedIndex = ref(-1);
const selectedClip = computed(() => project.value?.clips[selectedIndex.value]);
const dirty = computed(() => !!project.value && JSON.stringify(project.value) !== savedContents.value);
const dragIndex = ref(-1);
const dropIndex = ref(-1);

const audio = ref<HTMLAudioElement>();
const musicInput = ref<HTMLInputElement>();
const musicMenu = ref(false);
const musicSource = ref<MediaSource>();
const loadingMusic = ref(false);
const importingMusic = ref(false);
const musicLabel = computed(() => {
  const path = project.value?.music;
  if (!path) return '';
  const name = basename(path);
  return dirname(path) === musicDirectory ? name.replace(/^[0-9a-f-]{36}-/i, '') : name;
});
let musicRequest = 0;
const { prompt, ask, finish } = usePathPrompt();

const playing = ref(false);
const playingIndex = ref(-1);
const previewTime = ref(0);
const totalTime = computed(() => project.value?.clips.reduce((time, clip) => time + clip.duration, 0) ?? 0);
const previewClip = computed(() => (playing.value ? project.value?.clips[playingIndex.value] : selectedClip.value));
let frame = 0;

function toError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
function projectPath(id: string) {
  return join(directory, `${id}.json`);
}
function readProject(contents: string, id: string): Project {
  const data = JSON.parse(contents) as Project;
  if (
    data?.version !== 1 ||
    data.id !== id ||
    typeof data.name !== 'string' ||
    !data.name.trim() ||
    (data.music !== null && (typeof data.music !== 'string' || !audioPattern.test(data.music))) ||
    !Array.isArray(data.clips) ||
    data.clips.some(
      (clip) =>
        !clip ||
        typeof clip.id !== 'string' ||
        !Number.isFinite(clip.duration) ||
        clip.duration < 0.1 ||
        clip.duration > 60 ||
        (clip.kind === 'photo'
          ? typeof clip.path !== 'string' || !imagePattern.test(clip.path)
          : clip.kind !== 'title' || typeof clip.text !== 'string')
    )
  ) {
    throw new Error('视频项目文件格式无效。');
  }
  return data;
}
async function loadProjects() {
  loading.value = true;
  feedback.value = '';
  const entries: SavedProject[] = [];
  let invalidCount = 0;
  try {
    if ((await sys.fs.stat(directory))?.isDirectory) {
      for (const file of await sys.fs.readdir(directory)) {
        if (!file.isFile || !/^[0-9a-f-]{36}\.json$/i.test(file.name)) continue;
        try {
          const contents = await sys.fs.readFile(file.path);
          if (!contents) throw new Error('视频项目文件为空。');
          entries.push({
            project: readProject(contents, file.name.slice(0, -5)),
            contents,
            mtime: new Date(file.mtime).getTime(),
          });
        } catch {
          invalidCount++;
        }
      }
    }
    if (disposed || project.value) return;
    projects.value = entries.sort((a, b) => b.mtime - a.mtime);
    if (invalidCount) feedback.value = `有 ${invalidCount} 个项目无法读取。`;
  } catch (error) {
    if (!disposed && !project.value) feedback.value = `无法读取视频项目。 ${toError(error)}`;
  } finally {
    loading.value = false;
  }
}
async function loadLibrary() {
  if (readingLibrary) return;
  readingLibrary = true;
  try {
    const entries = (await sys.fs.stat(props.library))?.isDirectory ? await sys.fs.readdir(props.library) : [];
    if (disposed) return;
    const paths = entries
      .filter((file) => file.isFile && imagePattern.test(file.name))
      .map((file) => file.path)
      .sort((a, b) => basename(a).localeCompare(basename(b), 'zh-CN'));
    if (props.photoPath && !paths.includes(props.photoPath)) paths.unshift(props.photoPath);
    libraryPhotos.value = paths;
    for (const path of paths) {
      if (disposed) break;
      await loadImage(path);
    }
  } catch (error) {
    readingLibrary = false;
    if (!disposed) feedback.value = `无法读取照片。 ${toError(error)}`;
  }
}
const loadingImages = new Map<string, Promise<void>>();
function markImageUnavailable(path: string) {
  imageSources.get(path)?.release();
  imageSources.delete(path);
  delete images.value[path];
  unavailable.value.add(path);
}
function loadImage(path: string) {
  if (imageSources.has(path) || unavailable.value.has(path)) return Promise.resolve();
  const pending = loadingImages.get(path);
  if (pending) return pending;
  const task = virtualMedia(sys, path, 'image')
    .then((source) => {
      if (disposed) {
        source.release();
        return;
      }
      imageSources.set(path, source);
      images.value[path] = source.url;
    })
    .catch(() => {
      if (!disposed) unavailable.value.add(path);
    })
    .finally(() => loadingImages.delete(path));
  loadingImages.set(path, task);
  return task;
}
function createProject() {
  feedback.value = '';
  project.value = { version: 1, id: crypto.randomUUID(), name: '新建视频项目', clips: [], music: null };
  savedContents.value = '';
  selectedIndex.value = -1;
  void loadLibrary();
  if (props.photoPath) addPhoto(props.photoPath);
}
function openProject(entry: SavedProject) {
  feedback.value = '';
  project.value = readProject(entry.contents, entry.project.id);
  savedContents.value = entry.contents;
  selectedIndex.value = project.value.clips.length ? 0 : -1;
  void loadLibrary();
  for (const clip of project.value.clips) {
    if (clip.kind === 'photo') void loadImage(clip.path);
  }
  if (props.photoPath) addPhoto(props.photoPath);
}
async function save() {
  if (!project.value?.name.trim() || saving.value || importingMusic.value) return false;
  saving.value = true;
  feedback.value = '';
  const current = project.value;
  try {
    if (!(await sys.fs.stat(directory))?.isDirectory) await sys.fs.mkdir(directory);
    const path = projectPath(current.id);
    const previous = await sys.fs.readFile(path);
    if (previous !== (savedContents.value || null)) {
      throw new Error('此项目已在其他窗口更改，请重新打开后再编辑。');
    }
    current.name = current.name.trim();
    const contents = JSON.stringify(current);
    await sys.fs.writeFile(path, contents, { flag: previous === null ? 'wx' : 'w' });
    if ((await sys.fs.readFile(path)) !== contents) throw new Error('无法确认项目已写入。');
    savedContents.value = contents;
    feedback.value = '项目已保存';
    return true;
  } catch (error) {
    feedback.value = `保存项目失败。 ${toError(error)}`;
    return false;
  } finally {
    saving.value = false;
  }
}
async function confirmClose() {
  if (saving.value || importingMusic.value) return false;
  if (!dirty.value) return true;
  const result = await Dialog.showMessageBox({
    title: '视频编辑器',
    message: '是否保存对视频项目的更改？',
    buttons: ['保存', '不保存', '取消'],
    type: 'warning',
  });
  if (result.response === 0) return save();
  return result.response === 1;
}
defineExpose({ confirmClose });
async function backToProjects() {
  if (!(await confirmClose())) return;
  stopPreview();
  project.value = undefined;
  savedContents.value = '';
  selectedIndex.value = -1;
  musicMenu.value = false;
  await loadProjects();
}
function onEscape() {
  if (prompt.value) return;
  if (musicMenu.value) musicMenu.value = false;
  else if (playing.value) stopPreview();
  else if (project.value) void backToProjects();
  else emit('close');
}
function addPhoto(path: string) {
  if (!project.value) return;
  project.value.clips.push({ id: crypto.randomUUID(), kind: 'photo', path, duration: 3 });
  selectedIndex.value = project.value.clips.length - 1;
  void loadImage(path);
}
function addTitle() {
  if (!project.value) return;
  project.value.clips.push({ id: crypto.randomUUID(), kind: 'title', text: '标题', duration: 3 });
  selectedIndex.value = project.value.clips.length - 1;
}
function updateDuration(event: Event) {
  const seconds = (event.target as HTMLInputElement).valueAsNumber;
  if (selectedClip.value && seconds >= 0.1 && seconds <= 60) selectedClip.value.duration = seconds;
}
function setDuration(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!selectedClip.value) return;
  const seconds = input.valueAsNumber;
  if (Number.isFinite(seconds)) selectedClip.value.duration = Math.max(0.1, Math.min(60, Math.round(seconds * 10) / 10));
  input.value = String(selectedClip.value.duration);
}
function removeClip() {
  if (!project.value || selectedIndex.value < 0) return;
  project.value.clips.splice(selectedIndex.value, 1);
  selectedIndex.value = Math.min(selectedIndex.value, project.value.clips.length - 1);
}
function moveClip(from: number, to: number) {
  const clips = project.value?.clips;
  if (!clips || from === to || from < 0 || to < 0 || from >= clips.length || to >= clips.length) return;
  const [clip] = clips.splice(from, 1);
  clips.splice(to, 0, clip);
  selectedIndex.value = to;
}
function startDrag(index: number, event: DragEvent) {
  if (playing.value || saving.value || !event.dataTransfer) {
    event.preventDefault();
    return;
  }
  dragIndex.value = index;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', String(index));
}
function dragOver(index: number, event: DragEvent) {
  if (dragIndex.value < 0) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  dropIndex.value = index;
}
function dropClip(index: number, event: DragEvent) {
  if (dragIndex.value < 0) return;
  event.preventDefault();
  moveClip(dragIndex.value, index);
  clearDrag();
}
function clearDrag() {
  dragIndex.value = -1;
  dropIndex.value = -1;
}

function setMusic(path: string | null) {
  musicMenu.value = false;
  if (project.value) project.value.music = path;
}
async function chooseVirtualMusic() {
  musicMenu.value = false;
  const current = project.value;
  if (!current) return;
  const input = await ask('选择背景音乐', current.music ?? join(dirname(props.library), 'Music') + '/', '打开');
  if (!input?.trim() || current !== project.value) return;
  const path = virtualPath(sys, input);
  try {
    if (!audioPattern.test(path) || !(await sys.fs.stat(path))?.isFile) throw new Error('找不到支持的音频文件。');
    if (current === project.value) setMusic(path);
  } catch (error) {
    feedback.value = toError(error);
  }
}
async function importMusic(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  musicMenu.value = false;
  const current = project.value;
  if (!file || !current || importingMusic.value) return;
  importingMusic.value = true;
  feedback.value = '';
  try {
    if (!audioPattern.test(file.name) || !file.size) throw new Error('请选择有效的音频文件。');
    if (!(await sys.fs.stat(directory))?.isDirectory) await sys.fs.mkdir(directory);
    if (!(await sys.fs.stat(musicDirectory))?.isDirectory) await sys.fs.mkdir(musicDirectory);
    const path = join(musicDirectory, `${crypto.randomUUID()}-${basename(file.name)}`);
    if (sys.fs.writeBinaryFile) {
      await sys.fs.writeBinaryFile(path, new Uint8Array(await file.arrayBuffer()), { flag: 'wx' });
    } else {
      const contents = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      await sys.fs.writeFile(path, contents, { flag: 'wx' });
    }
    if (!disposed && current === project.value) setMusic(path);
  } catch (error) {
    if (!disposed) feedback.value = `导入背景音乐失败。 ${toError(error)}`;
  } finally {
    importingMusic.value = false;
  }
}
watch(
  () => project.value?.music,
  async (path) => {
    const request = ++musicRequest;
    musicSource.value?.release();
    musicSource.value = undefined;
    loadingMusic.value = Boolean(path);
    if (!path) return;
    try {
      const next = await virtualMedia(sys, path, 'media');
      if (disposed || request !== musicRequest) next.release();
      else musicSource.value = next;
    } catch (error) {
      if (!disposed && request === musicRequest) feedback.value = `背景音乐不可用。 ${toError(error)}`;
    } finally {
      if (!disposed && request === musicRequest) loadingMusic.value = false;
    }
  }
);
function audioError() {
  if (musicSource.value) feedback.value = '浏览器无法播放这段背景音乐。';
}
function formatTime(value: number) {
  const seconds = Math.floor(value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
function stopPreview() {
  cancelAnimationFrame(frame);
  playing.value = false;
  playingIndex.value = -1;
  previewTime.value = 0;
  if (audio.value) {
    audio.value.pause();
    if (audio.value.readyState) audio.value.currentTime = 0;
  }
}
function togglePreview() {
  if (playing.value) {
    stopPreview();
    return;
  }
  const clips = project.value?.clips;
  if (!clips?.length) return;
  feedback.value = '';
  musicMenu.value = false;
  const endTimes: number[] = [];
  let total = 0;
  for (const clip of clips) {
    total += clip.duration;
    endTimes.push(total);
  }
  playing.value = true;
  playingIndex.value = 0;
  if (musicSource.value && audio.value) {
    void audio.value.play().catch(() => {
      if (playing.value) feedback.value = '无法播放背景音乐。';
    });
  } else if (project.value?.music) {
    feedback.value = '背景音乐尚不可用，预览将静音播放。';
  }
  const start = performance.now();
  const update = (now: number) => {
    const elapsed = (now - start) / 1000;
    if (elapsed >= total) {
      selectedIndex.value = clips.length - 1;
      stopPreview();
      return;
    }
    previewTime.value = elapsed;
    while (playingIndex.value + 1 < endTimes.length && elapsed >= endTimes[playingIndex.value]) {
      playingIndex.value++;
    }
    frame = requestAnimationFrame(update);
  };
  frame = requestAnimationFrame(update);
}
onMounted(() => {
  if (props.newProject) createProject();
  else void loadProjects();
});
onUnmounted(() => {
  disposed = true;
  stopPreview();
  musicSource.value?.release();
  for (const source of imageSources.values()) source.release();
});
</script>

<style scoped>
.video-editor {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: #202020;
  color: #fff;
}
.video-toolbar,
.story-toolbar,
.playback {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 12px;
}
.video-toolbar {
  position: relative;
  z-index: 1;
  border-bottom: 1px solid #3c3c3c;
}
.video-toolbar h1,
.story-toolbar h2,
.project-library h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.video-toolbar h1,
.toolbar-spacer {
  flex: 1;
}
.video-editor button,
.video-editor input {
  box-sizing: border-box;
  font: inherit;
}
.video-editor button {
  border: 1px solid transparent;
  border-radius: 0;
  padding: 6px 8px;
  color: inherit;
  background: #343434;
  cursor: pointer;
}
.video-editor button:hover:not(:disabled) {
  background: #474747;
}
.video-editor button:disabled {
  color: #aaa;
  cursor: default;
}
.video-editor button:focus-visible,
.video-editor input:focus-visible {
  outline: 2px solid #6cb8ff;
  outline-offset: -2px;
}
.video-editor button.accent {
  background: #0067b8;
}
.video-editor button.accent:hover:not(:disabled) {
  background: #0878d0;
}
.video-editor button.accent:disabled {
  background: #343434;
}
.video-editor input {
  min-width: 0;
  width: 190px;
  padding: 5px 7px;
  border: 1px solid #737373;
  border-radius: 0;
  background: #2c2c2c;
  color: inherit;
}
.mdl {
  margin-right: 6px;
  font-family: 'SEGOEUIMDL';
}
.project-list,
.asset-grid {
  display: grid;
  align-content: start;
  gap: 8px;
}
.project-list {
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  padding: 16px;
  overflow: auto;
}
.project-list p {
  grid-column: 1 / -1;
  margin: 4px 0;
  color: #ccc;
}
.video-editor .project-tile,
.video-editor .asset-tile,
.video-editor .story-tile {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 4px;
  text-align: left;
}
.project-tile strong,
.asset-tile > span:last-child,
.clip-caption > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.project-tile > span:last-child,
.playback-time {
  color: #ddd;
}
.project-thumbnail {
  display: grid;
  aspect-ratio: 16 / 9;
  place-items: center;
  background: #252525;
  font-size: 27px;
}
.project-workspace {
  display: grid;
  grid-template-columns: minmax(130px, 1fr) minmax(180px, 1.35fr);
  flex: 1;
  min-height: 165px;
}
.project-library,
.preview-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.project-library {
  border-right: 1px solid #3c3c3c;
}
.project-library h2 {
  padding: 10px 12px;
}
.asset-grid {
  grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
  padding: 0 12px 12px;
  overflow: auto;
}
.asset-tile img,
.story-tile img,
.asset-placeholder,
.card-thumb {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: #242424;
}
.asset-placeholder,
.card-thumb {
  display: grid;
  place-items: center;
}
.card-thumb {
  overflow: hidden;
  overflow-wrap: anywhere;
  padding: 4px;
  background: #263a54;
}
.preview {
  display: grid;
  grid-template: minmax(0, 1fr) / minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  padding: 8px;
  place-items: center;
  overflow: hidden;
  background: #111;
}
.preview img {
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: contain;
}
.preview-title {
  display: grid;
  place-items: center;
  align-self: stretch;
  justify-self: stretch;
  overflow-wrap: anywhere;
  padding: 12px;
  background: #263a54;
  font-size: clamp(18px, 2.5vw, 40px);
  text-align: center;
}
.preview p,
.empty {
  color: #ccc;
}
.playback {
  flex-wrap: nowrap;
}
.playback-time {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.music-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.music-control {
  position: relative;
}
.music-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 2;
  min-width: max-content;
  padding: 2px;
  border: 1px solid #666;
  background: #2a2a2a;
  box-shadow: 0 4px 12px #0007;
}
.video-editor .music-menu button {
  display: block;
  width: 100%;
  text-align: left;
}
.storyboard {
  flex-shrink: 0;
  min-height: 130px;
  border-top: 1px solid #484848;
  background: #292929;
}
.story-toolbar label,
.title-card-field {
  display: flex;
  align-items: center;
  gap: 6px;
}
.story-toolbar input {
  width: 64px;
}
.title-card-field {
  margin: 0 12px 6px;
}
.story-track {
  display: flex;
  gap: 6px;
  padding: 0 12px 10px;
  overflow: auto;
}
.video-editor .story-tile {
  width: 116px;
  flex: none;
}
.video-editor .story-tile.selected {
  border-color: #6cb8ff;
}
.video-editor .story-tile.drop-target {
  background: #245884;
}
.clip-caption {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}
.clip-caption > span:last-child {
  flex-shrink: 0;
}
.empty,
.feedback {
  margin: 6px 12px;
}
.feedback {
  color: #ddd;
}
</style>
