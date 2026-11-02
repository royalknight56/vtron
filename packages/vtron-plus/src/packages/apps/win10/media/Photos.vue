<template>
  <Win10Frame :title="title" background="#000" color="#fff" titlebar-background="#202020">
    <section ref="root" class="photos" tabindex="0" @keydown="keyboard">
      <template v-if="viewing">
        <div class="viewer-toolbar">
          <button class="all-photos" @click="showCollection">
            <span class="mdl">&#xE7C5;</span>查看所有照片</button
          ><button class="creation" disabled><span class="mdl">&#xE710;</span>添加到创作</button
          ><span class="toolbar-space"></span>
          <div class="zoom-control">
            <button :disabled="!source" aria-label="缩放" title="缩放" @click="zoomOpen = !zoomOpen">
              <span class="mdl">&#xE8A3;</span>
            </button>
            <div v-if="zoomOpen" class="zoom-popup">
              <button @click="zoom = 100">适应窗口</button
              ><input
                v-model.number="zoom"
                aria-label="缩放"
                type="range"
                min="25"
                max="400"
                step="25"
              /><span>{{ zoom }}%</span>
            </div>
          </div>
          <button disabled aria-label="删除" title="删除"><span class="mdl">&#xE74D;</span></button
          ><button disabled aria-label="添加到收藏夹" title="添加到收藏夹">
            <span class="mdl">&#xE734;</span></button
          ><button
            :disabled="!source"
            aria-label="旋转"
            title="旋转"
            @click="rotation = (rotation + 90) % 360"
          >
            <span class="mdl">&#xE7AD;</span></button
          ><span class="toolbar-space"></span
          ><button disabled class="edit"><span class="mdl">&#xE70F;</span>编辑和创建⌄</button
          ><button disabled><span class="mdl">&#xE72D;</span>共享</button
          ><button disabled title="打印" aria-label="打印"><span class="mdl">&#xE749;</span></button
          ><button title="更多" aria-label="更多" @click="menu = !menu">
            <span class="mdl">&#xE712;</span>
          </button>
        </div>
        <div ref="viewport" class="viewport">
          <div v-if="source" class="image-stage" :style="stageStyle">
            <img
              :src="source.url"
              :alt="name"
              draggable="false"
              :style="imageStyle"
              @load="imageLoaded"
              @error="imageError"
            />
          </div>
          <p v-else-if="!busy" class="empty-view">无法显示此图片</p>
          <button class="previous arrow" :disabled="index <= 0" aria-label="上一张" @click="navigate(-1)">
            <span class="mdl">&#xE76B;</span></button
          ><button
            class="next arrow"
            :disabled="index < 0 || index >= siblings.length - 1"
            aria-label="下一张"
            @click="navigate(1)"
          >
            <span class="mdl">&#xE76C;</span>
          </button>
        </div>
      </template>
      <template v-else>
        <nav class="collection-toolbar">
          <button class="current" @click="refresh">集合</button><button disabled>相册</button
          ><button disabled>人员</button><button @click="chooseFolder">文件夹</button
          ><button disabled>视频编辑器</button
          ><input v-model="search" placeholder="搜索照片" aria-label="搜索照片" /><button
            @click="importInput?.click()"
          >
            <span class="mdl">&#xE8B5;</span>导入</button
          ><button title="更多" aria-label="更多" @click="menu = !menu">
            <span class="mdl">&#xE712;</span>
          </button>
        </nav>
        <div class="collection">
          <div v-if="filtered.length" class="collection-heading">{{ folder.split('/').pop() }}</div>
          <div v-if="filtered.length" class="photo-grid">
            <button v-for="item in filtered" :key="item.path" :title="item.name" @click="load(item.path)">
              <img :src="item.url" :alt="item.name" loading="lazy" /><span>{{ item.name }}</span>
            </button>
          </div>
          <div v-else class="collection-empty">
            <img class="empty-icon" :src="emptyIcon" alt="" />
            <h1>{{ busy ? '正在加载…' : '没有可显示的照片' }}</h1>
            <button v-if="!busy" @click="open">打开照片</button>
          </div>
        </div>
      </template>
      <div v-if="menu" class="more-menu">
        <button @click="open">打开文件</button
        ><button
          @click="
            importInput?.click();
            menu = false;
          "
        >
          从本机打开</button
        ><button :disabled="!source || !viewing" @click="info">文件信息</button>
        <hr />
        <button disabled>幻灯片放映</button><button disabled>设为桌面背景</button
        ><button disabled>设置</button>
      </div>
      <input
        ref="importInput"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/bmp"
        multiple
        hidden
        @change="importFiles"
      /><MediaPathDialog :state="prompt" @finish="finish" />
    </section>
  </Win10Frame>
</template>
<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { BrowserWindow, Dialog, System, basename, dirname, join } from 'vtron';
import Win10Frame from '../../daily/Win10Frame.vue';
import MediaPathDialog from './MediaPathDialog.vue';
import emptyIcon from './assets/photos-empty.png';
import {
  desktopPath,
  imagePattern,
  message,
  type MediaSource,
  usePathPrompt,
  virtualMedia,
  virtualPath,
} from './mediaFiles';
const sys = inject<System>('system')!,
  win = inject<BrowserWindow>('browserWindow');
const root = ref<HTMLElement>(),
  viewport = ref<HTMLElement>(),
  importInput = ref<HTMLInputElement>();
const { prompt, ask, finish } = usePathPrompt();
const viewing = ref(false),
  source = ref<MediaSource | null>(null),
  path = ref(''),
  name = ref(''),
  busy = ref(false),
  menu = ref(false),
  zoomOpen = ref(false),
  zoom = ref(100),
  rotation = ref(0),
  search = ref('');
const folder = ref(join(sys._options.userLocation || '/C/Users', 'Photo'));
const siblings = ref<{ path: string; name: string; local?: File }[]>([]),
  collection = ref<{ path: string; name: string; url: string }[]>([]);
let collectionSources: MediaSource[] = [],
  loadVersion = 0,
  collectionVersion = 0;
const index = computed(() => siblings.value.findIndex((item) => item.path === path.value));
const filtered = computed(() =>
  collection.value.filter((item) => item.name.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()))
);
const title = computed(() => (viewing.value ? `${name.value || '照片'} - 照片` : '照片'));
watch(title, (value) => win?.setTitle(value), { immediate: true });
const natural = ref({ width: 0, height: 0 }),
  box = ref({ width: 800, height: 500 });
const rotated = computed(() =>
  rotation.value % 180 ? { width: natural.value.height, height: natural.value.width } : natural.value
);
const scale = computed(
  () =>
    (Math.min(
      1,
      (box.value.width - 70) / (rotated.value.width || 1),
      (box.value.height - 40) / (rotated.value.height || 1)
    ) *
      zoom.value) /
    100
);
const stageStyle = computed(() => ({
  width: Math.max(box.value.width, rotated.value.width * scale.value) + 'px',
  height: Math.max(box.value.height, rotated.value.height * scale.value) + 'px',
}));
const imageStyle = computed(() => ({
  width: natural.value.width * scale.value + 'px',
  height: natural.value.height * scale.value + 'px',
  transform: `translate(-50%,-50%) rotate(${rotation.value}deg)`,
}));
let observer: ResizeObserver | undefined;
watch(viewport, (value) => {
  observer?.disconnect();
  if (value) {
    observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      box.value = { width: rect.width, height: rect.height };
    });
    observer.observe(value);
  }
});
function imageLoaded(event: Event) {
  const image = event.target as HTMLImageElement;
  natural.value = { width: image.naturalWidth, height: image.naturalHeight };
}
function imageError() {
  source.value?.release();
  source.value = null;
  void message('照片', '无法显示此图片，文件可能已损坏或格式不受支持。');
}
async function load(filePath: string, local?: File) {
  const version = ++loadVersion;
  busy.value = true;
  menu.value = false;
  try {
    const next = local
      ? {
          url: URL.createObjectURL(local),
          release() {
            URL.revokeObjectURL(this.url);
          },
        }
      : await virtualMedia(sys, filePath, 'image');
    if (version !== loadVersion) {
      next.release();
      return;
    }
    source.value?.release();
    source.value = next;
    path.value = filePath;
    name.value = local?.name || basename(filePath);
    rotation.value = 0;
    zoom.value = 100;
    natural.value = { width: 0, height: 0 };
    viewing.value = true;
    if (!local) {
      folder.value = dirname(filePath);
      const entries = await sys.fs.readdir(folder.value);
      if (version === loadVersion)
        siblings.value = entries
          .filter((item) => item.isFile && imagePattern.test(item.path))
          .map((item) => ({ path: item.path, name: item.name }))
          .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    }
    await nextTick();
    root.value?.focus({ preventScroll: true });
  } catch (error) {
    await message('照片', error);
  } finally {
    if (version === loadVersion) busy.value = false;
  }
}
async function showCollection() {
  viewing.value = false;
  await refresh();
}
async function refresh() {
  const version = ++collectionVersion;
  busy.value = true;
  for (const source of collectionSources) source.release();
  collectionSources = [];
  collection.value = [];
  try {
    const info = await sys.fs.stat(folder.value);
    if (!info?.isDirectory) return;
    const files = (await sys.fs.readdir(folder.value))
      .filter((item) => item.isFile && imagePattern.test(item.path))
      .slice(0, 200);
    for (const file of files) {
      try {
        const next = await virtualMedia(sys, file.path, 'image');
        if (version !== collectionVersion) {
          next.release();
          return;
        }
        collectionSources.push(next);
        collection.value.push({ path: file.path, name: file.name, url: next.url });
      } catch {
        /* Unsupported images are omitted. */
      }
    }
  } catch (error) {
    await message('照片', error);
  } finally {
    if (version === collectionVersion) busy.value = false;
  }
}
async function open() {
  menu.value = false;
  const answer = await ask(
    '打开照片',
    path.value && !path.value.startsWith('local:') ? path.value : desktopPath(sys, '图片.png')
  );
  if (answer?.trim()) await load(virtualPath(sys, answer));
}
async function chooseFolder() {
  const answer = await ask('选择文件夹', folder.value, '选择文件夹');
  if (!answer?.trim()) return;
  const destination = virtualPath(sys, answer);
  if (!(await sys.fs.stat(destination))?.isDirectory) {
    await message('照片', '指定的文件夹不存在。');
    return;
  }
  folder.value = destination;
  await refresh();
}
function navigate(direction: number) {
  const next = siblings.value[index.value + direction];
  if (next) void load(next.path, next.local);
}
async function importFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []).filter((file) =>
    /^image\/(png|jpeg|gif|webp|bmp)$/.test(file.type)
  );
  input.value = '';
  if (!files.length) return;
  siblings.value = files.map((file, index) => ({
    path: 'local:' + index + ':' + file.name,
    name: file.name,
    local: file,
  }));
  await load(siblings.value[0].path, files[0]);
}
async function info() {
  menu.value = false;
  await Dialog.showMessageBox({
    title: '文件信息',
    message: `${name.value}\n${natural.value.width} × ${natural.value.height} 像素\n${path.value.startsWith('local:') ? '本机所选文件' : path.value}`,
    buttons: ['确定'],
  });
}
function keyboard(event: KeyboardEvent) {
  if (prompt.value || (event.target as Element).closest('input')) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') {
    event.preventDefault();
    void open();
  }
  if (viewing.value) {
    if (event.key === 'ArrowLeft') navigate(-1);
    if (event.key === 'ArrowRight') navigate(1);
    if (event.key === 'Escape') viewing.value = false;
    if (event.key === '+' || event.key === '=') zoom.value = Math.min(400, zoom.value + 25);
    if (event.key === '-') zoom.value = Math.max(25, zoom.value - 25);
  }
}
onMounted(async () => {
  if (typeof win?.config.path === 'string') await load(virtualPath(sys, win.config.path));
  else await refresh();
  root.value?.focus({ preventScroll: true });
});
onUnmounted(() => {
  loadVersion++;
  collectionVersion++;
  observer?.disconnect();
  source.value?.release();
  collectionSources.forEach((source) => source.release());
});
</script>
<style scoped>
.photos,
.photos * {
  box-sizing: border-box;
}
.photos {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #000;
  color: #fff;
  outline: 0;
  font:
    13px/1.35 'Segoe UI',
    'Microsoft YaHei UI',
    sans-serif;
}
button,
input {
  font: inherit;
  border-radius: 0;
  color: inherit;
}
button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  background: transparent;
  cursor: default;
  padding: 0 13px;
}
button:hover:enabled {
  background: #333;
}
button:disabled {
  color: #777;
}
button:focus-visible {
  outline: 1px solid #aaa;
  outline-offset: -3px;
}
.mdl {
  font: 18px/1 'SEGOEUIMDL';
}
.viewer-toolbar {
  height: 48px;
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  user-select: none;
}
.viewer-toolbar > button,
.zoom-control > button {
  min-width: 48px;
}
.viewer-toolbar .all-photos {
  background: #0078d7;
  white-space: nowrap;
}
.viewer-toolbar .all-photos:hover {
  background: #006cbe;
}
.creation {
  white-space: nowrap;
}
.toolbar-space {
  flex: 1;
  min-width: 3px;
}
.viewer-toolbar .edit {
  white-space: nowrap;
}
.zoom-control {
  position: relative;
  display: flex;
}
.zoom-popup {
  position: absolute;
  z-index: 4;
  top: 48px;
  left: -65px;
  width: 260px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px;
  background: #272727;
  border: 1px solid #555;
  box-shadow: 0 3px 10px #0005;
}
.zoom-popup button {
  font-size: 11px;
  padding: 0 3px;
  white-space: nowrap;
}
.zoom-popup input {
  width: 110px;
  accent-color: #0078d7;
}
.zoom-popup span {
  font-size: 11px;
}
.viewport {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.image-stage {
  position: relative;
  min-width: 100%;
  min-height: 100%;
}
.image-stage > img {
  display: block;
  position: absolute;
  left: 50%;
  top: 50%;
  object-fit: contain;
  max-width: none;
  user-select: none;
}
.arrow {
  position: fixed;
  top: 50%;
  width: 52px;
  height: 68px;
  background: #0006;
  z-index: 2;
}
.arrow.previous {
  left: 8px;
}
.arrow.next {
  right: 8px;
}
.viewport .arrow {
  position: absolute;
  top: calc(50% - 34px);
}
.arrow .mdl {
  font-size: 32px;
}
.arrow:disabled {
  visibility: hidden;
}
.empty-view {
  position: absolute;
  inset: 45% 0 auto;
  text-align: center;
  color: #aaa;
}
.collection-toolbar {
  display: flex;
  height: 44px;
  flex-shrink: 0;
  gap: 3px;
  padding: 0 14px;
  align-items: center;
}
.collection-toolbar > button {
  position: relative;
  height: 40px;
  padding: 0 10px;
  white-space: nowrap;
}
.collection-toolbar .current::after {
  content: '';
  position: absolute;
  bottom: 0;
  height: 3px;
  left: 10px;
  right: 10px;
  background: #0078d7;
}
.collection-toolbar input {
  flex: 1;
  min-width: 80px;
  max-width: 250px;
  margin-left: 14px;
  background: #242424;
  border: 1px solid #333;
  padding: 5px 10px;
  height: 30px;
}
.collection {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 22px 40px;
}
.collection-heading {
  font-size: 14px;
  color: #6fc0ff;
  margin-bottom: 12px;
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
  gap: 5px;
}
.photo-grid > button {
  display: block;
  padding: 0;
  min-width: 0;
  text-align: left;
}
.photo-grid img {
  display: block;
  width: 100%;
  height: 125px;
  object-fit: cover;
}
.photo-grid span {
  display: block;
  font-size: 11px;
  color: #ccc;
  padding: 4px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.collection-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  color: #c8c8c8;
}
.collection-empty > .empty-icon {
  width: 64px;
  height: 47px;
  filter: invert(1);
}
.collection-empty h1 {
  font-size: 30px;
  font-weight: 300;
  margin: 0;
}
.collection-empty button {
  height: 34px;
  color: #4ba8ee;
  background: transparent;
  text-decoration: underline;
  padding: 0 24px;
}
.more-menu {
  position: absolute;
  z-index: 8;
  right: 5px;
  top: 48px;
  width: 220px;
  padding: 4px 0;
  background: #292929;
  border: 1px solid #555;
  box-shadow: 0 4px 14px #0006;
}
.more-menu button {
  height: 36px;
  justify-content: flex-start;
  width: 100%;
  padding: 0 20px;
}
.more-menu hr {
  border: 0;
  border-top: 1px solid #555;
  margin: 4px 0;
}
</style>
