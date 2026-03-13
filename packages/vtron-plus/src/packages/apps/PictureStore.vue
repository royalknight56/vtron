<template>
  <div class="picture-app" :class="{ 'picture-app--dark': isDarkTheme }">
    <header class="picture-app__header">
      <div class="picture-app__header-left">
        <span class="picture-app__logo segoicon SEGOEUIMDL">&#xE728;</span>
        <span class="picture-app__title">图片</span>
      </div>
      <div class="picture-app__header-actions">
        <div
          class="picture-app__header-btn"
          @click="toggleTheme"
          :title="isDarkTheme ? '亮色模式' : '暗色模式'"
        >
          <span class="segoicon SEGOEUIMDL">{{ isDarkTheme ? '&#xE793;' : '&#xE708;' }}</span>
        </div>
      </div>
    </header>

    <nav class="picture-app__nav">
      <div class="picture-app__tabs">
        <div
          class="picture-app__tab"
          @click="activeTab = 1"
          :class="{ 'picture-app__tab--active': activeTab === 1 }"
        >
          <span class="segoicon SEGOEUIMDL">&#xE8B9;</span>
          <span>我的图片</span>
        </div>
        <div
          class="picture-app__tab"
          @click="activeTab = 2"
          :class="{ 'picture-app__tab--active': activeTab === 2 }"
        >
          <span class="segoicon SEGOEUIMDL">&#xE7C5;</span>
          <span>上传图片</span>
        </div>
      </div>
      <div class="picture-app__nav-meta" v-if="activeTab === 1 && photoList.length > 0">
        {{ photoList.length }} 张图片
      </div>
    </nav>

    <div class="picture-app__body">
      <!-- Gallery Grid -->
      <div class="picture-app__gallery" v-if="activeTab === 1 && !viewerOpen">
        <div class="picture-app__empty" v-if="photoList.length === 0">
          <span class="picture-app__empty-icon segoicon SEGOEUIMDL">&#xE8B9;</span>
          <p class="picture-app__empty-title">暂无图片</p>
          <p class="picture-app__empty-hint">前往「上传图片」添加你的图片</p>
        </div>
        <div class="picture-app__grid" v-else>
          <div
            class="picture-app__card"
            v-for="(item, index) in photoList"
            :key="item.path"
            @click="openViewer(index)"
          >
            <div class="picture-app__card-preview">
              <img
                v-if="thumbnails[item.path]"
                :src="thumbnails[item.path]"
                draggable="false"
              />
              <div class="picture-app__card-loading" v-else>
                <span class="segoicon SEGOEUIMDL">&#xE8B9;</span>
              </div>
              <div class="picture-app__card-hover">
                <span class="segoicon SEGOEUIMDL">&#xE71A;</span>
              </div>
            </div>
            <div class="picture-app__card-info">
              <span class="picture-app__card-name">{{ item.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Image Viewer -->
      <div class="picture-app__viewer" v-if="activeTab === 1 && viewerOpen">
        <div class="picture-app__viewer-bar">
          <button class="picture-app__viewer-back" @click="closeViewer">
            <span class="segoicon SEGOEUIMDL">&#xE72B;</span>
            <span>返回</span>
          </button>
          <div class="picture-app__viewer-meta">
            <span class="picture-app__viewer-name">{{ photoList[currentIndex]?.name }}</span>
            <span class="picture-app__viewer-pos">{{ currentIndex + 1 }} / {{ photoList.length }}</span>
          </div>
          <div class="picture-app__viewer-tools">
            <button @click="zoomOut" title="缩小">
              <span style="font-size: 16px; font-weight: bold;">−</span>
            </button>
            <span class="picture-app__viewer-scale">{{ Math.round(scale * 100) }}%</span>
            <button @click="zoomIn" title="放大">
              <span style="font-size: 16px; font-weight: bold;">+</span>
            </button>
            <button @click="fitView" title="适应窗口">
              <span class="segoicon SEGOEUIMDL">&#xE72C;</span>
            </button>
            <button @click="rotateImage" title="旋转">
              <span class="segoicon SEGOEUIMDL">&#xE7AD;</span>
            </button>
            <div class="picture-app__viewer-divider"></div>
            <button class="picture-app__viewer-danger" @click="deletePhoto" title="删除">
              <span class="segoicon SEGOEUIMDL">&#xE74D;</span>
            </button>
          </div>
        </div>

        <div class="picture-app__viewer-stage" @wheel.prevent="handleWheel">
          <button
            class="picture-app__viewer-arrow picture-app__viewer-arrow--left"
            @click="prevPhoto"
            v-if="photoList.length > 1"
          >
            <span class="segoicon SEGOEUIMDL">&#xE76B;</span>
          </button>

          <img
            v-if="viewerContent"
            :src="viewerContent"
            draggable="false"
            class="picture-app__viewer-img"
            :style="{ transform: `scale(${scale}) rotate(${rotation}deg)` }"
          />
          <div class="picture-app__viewer-placeholder" v-else>
            <span class="segoicon SEGOEUIMDL">&#xE8B9;</span>
            <p>加载中...</p>
          </div>

          <button
            class="picture-app__viewer-arrow picture-app__viewer-arrow--right"
            @click="nextPhoto"
            v-if="photoList.length > 1"
          >
            <span class="segoicon SEGOEUIMDL">&#xE76C;</span>
          </button>
        </div>
      </div>

      <!-- Upload -->
      <div class="picture-app__upload" v-if="activeTab === 2">
        <div class="picture-app__upload-card">
          <div class="picture-app__upload-heading">
            <span class="picture-app__upload-title">上传图片</span>
            <span class="picture-app__upload-subtitle">将图片添加到你的图库</span>
          </div>
          <FileUploader :accept="'image/*'" @change="upload">
            <div class="picture-app__upload-drop">
              <div class="picture-app__upload-icon-circle">
                <span class="segoicon SEGOEUIMDL">&#xE7C5;</span>
              </div>
              <div class="picture-app__upload-text">
                将文件拖到此处，或<span class="picture-app__upload-link">点击选择文件</span>
              </div>
              <div class="picture-app__upload-hint">支持 jpg、png、gif、webp 等格式</div>
            </div>
          </FileUploader>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, ref, reactive } from 'vue';
import { System, VtronFileWithoutContent, join } from 'vtron';
import FileUploader from '../components/FileUploader.vue';

const sys = inject<System>('system')!;
const photoList = ref<VtronFileWithoutContent[]>([]);
const thumbnails = reactive<Record<string, string>>({});

const activeTab = ref(1);
const viewerOpen = ref(false);
const viewerContent = ref('');
const currentIndex = ref(0);
const scale = ref(1);
const rotation = ref(0);
const isDarkTheme = ref(false);

onMounted(() => {
  refreshPhotoList();
});

async function refreshPhotoList() {
  const list = await sys.fs.readdir(join(sys._options.userLocation || '', 'Photo'));
  photoList.value = list;
  loadThumbnails(list);
}

async function loadThumbnails(list: VtronFileWithoutContent[]) {
  for (const item of list) {
    if (!thumbnails[item.path]) {
      const data = await sys.fs.readFile(item.path);
      if (data) {
        thumbnails[item.path] = 'data:image/png;base64,' + data;
      }
    }
  }
}

async function openViewer(index: number) {
  currentIndex.value = index;
  scale.value = 1;
  rotation.value = 0;
  viewerOpen.value = true;
  await loadViewerImage(index);
}

async function loadViewerImage(index: number) {
  const item = photoList.value[index];
  if (!item) return;
  if (thumbnails[item.path]) {
    viewerContent.value = thumbnails[item.path];
    return;
  }
  const data = await sys.fs.readFile(item.path);
  viewerContent.value = data ? 'data:image/png;base64,' + data : '';
}

function closeViewer() {
  viewerOpen.value = false;
  viewerContent.value = '';
}

function prevPhoto() {
  currentIndex.value =
    currentIndex.value > 0 ? currentIndex.value - 1 : photoList.value.length - 1;
  scale.value = 1;
  rotation.value = 0;
  loadViewerImage(currentIndex.value);
}

function nextPhoto() {
  currentIndex.value =
    currentIndex.value < photoList.value.length - 1 ? currentIndex.value + 1 : 0;
  scale.value = 1;
  rotation.value = 0;
  loadViewerImage(currentIndex.value);
}

function zoomIn() {
  scale.value = Math.min(5, +(scale.value + 0.25).toFixed(2));
}

function zoomOut() {
  scale.value = Math.max(0.1, +(scale.value - 0.25).toFixed(2));
}

function fitView() {
  scale.value = 1;
  rotation.value = 0;
}

function rotateImage() {
  rotation.value = (rotation.value + 90) % 360;
}

function handleWheel(event: WheelEvent) {
  if (Math.sign(event.deltaY) > 0) {
    zoomOut();
  } else {
    zoomIn();
  }
}

async function deletePhoto() {
  const item = photoList.value[currentIndex.value];
  if (!item) return;

  await sys.fs.unlink(item.path);
  delete thumbnails[item.path];
  await refreshPhotoList();

  if (photoList.value.length === 0) {
    closeViewer();
  } else {
    currentIndex.value = Math.min(currentIndex.value, photoList.value.length - 1);
    await loadViewerImage(currentIndex.value);
  }

  sys.createNotify({ title: '删除成功', content: `${item.name} 已删除` });
}

async function upload(ev: Event) {
  const tar = ev.target as HTMLInputElement;
  if (!tar.files?.[0]) return;

  const file = tar.files[0];
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = async () => {
    const base64 = (reader.result || '').toString().replace(/^data:(.)*;base64,/, '');
    await sys.fs.writeFile(
      join(sys._options.userLocation || '', 'Photo', file.name),
      base64,
    );
    tar.value = '';
    await refreshPhotoList();
    sys.createNotify({ title: '上传成功', content: `${file.name} 已添加到图库` });
  };
}

function toggleTheme() {
  isDarkTheme.value = !isDarkTheme.value;
}
</script>

<style scoped lang="scss">
.picture-app {
  --bg: #f5f5f7;
  --surface: #ffffff;
  --surface-hover: #f0f1f3;
  --surface-active: #e4e6e9;
  --border: #e1e3e6;
  --text-1: #1d1d1f;
  --text-2: #5f6368;
  --text-3: #9aa0a6;
  --accent: #0071e3;
  --accent-soft: #e8f0fe;
  --danger: #ea4335;
  --danger-soft: #fce8e6;
  --shadow-1: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-2: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-3: 0 8px 28px rgba(0, 0, 0, 0.12);
  --radius: 8px;
  --radius-lg: 12px;
  --thumb-size: 152px;

  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text-1);
  user-select: none;
  overflow: hidden;
  transition:
    background 0.3s,
    color 0.3s;

  &--dark {
    --bg: #1a1a1a;
    --surface: #262626;
    --surface-hover: #303030;
    --surface-active: #3a3a3a;
    --border: #3a3a3a;
    --text-1: #e8eaed;
    --text-2: #9aa0a6;
    --text-3: #5f6368;
    --accent: #8ab4f8;
    --accent-soft: #1e3a5f;
    --danger: #f28b82;
    --danger-soft: #5f2120;
    --shadow-1: 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-2: 0 4px 12px rgba(0, 0, 0, 0.25);
    --shadow-3: 0 8px 28px rgba(0, 0, 0, 0.35);
  }

  // ── Header ──
  &__header {
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__logo {
    font-size: 20px;
    color: var(--accent);
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  &__header-actions {
    display: flex;
    align-items: center;
  }

  &__header-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    color: var(--text-2);
    transition: all 0.2s;

    &:hover {
      background: var(--surface-hover);
      color: var(--text-1);
    }

    .segoicon {
      font-size: 16px;
    }
  }

  // ── Nav / Tabs ──
  &__nav {
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  &__tabs {
    display: flex;
    height: 100%;
    gap: 2px;
  }

  &__tab {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 14px;
    font-size: 13px;
    color: var(--text-2);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;

    .segoicon {
      font-size: 13px;
    }

    &--active {
      color: var(--accent);
      border-bottom-color: var(--accent);
      font-weight: 500;
    }

    &:hover:not(&--active) {
      color: var(--text-1);
      background: var(--surface-hover);
    }
  }

  &__nav-meta {
    font-size: 12px;
    color: var(--text-3);
  }

  // ── Body ──
  &__body {
    flex: 1;
    min-height: 0;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  // ── Gallery Grid ──
  &__gallery {
    flex: 1;
    overflow-y: auto;
    padding: 20px;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--text-3);
      border-radius: 3px;
      &:hover {
        background: var(--text-2);
      }
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--thumb-size), 1fr));
    gap: 14px;
  }

  &__card {
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--surface);
    box-shadow: var(--shadow-1);
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-2);

      .picture-app__card-hover {
        opacity: 1;
      }
      .picture-app__card-preview img {
        transform: scale(1.06);
      }
    }

    &:active {
      transform: translateY(-1px);
    }
  }

  &__card-preview {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    background: var(--surface-hover);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
  }

  &__card-loading {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-3);
    .segoicon {
      font-size: 28px;
    }
  }

  &__card-hover {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.25s ease;

    .segoicon {
      font-size: 24px;
      color: #fff;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
    }
  }

  &__card-info {
    padding: 8px 10px;
  }

  &__card-name {
    font-size: 12px;
    color: var(--text-2);
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // ── Empty State ──
  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 260px;
  }

  &__empty-icon {
    font-size: 52px;
    color: var(--text-3);
    margin-bottom: 16px;
    opacity: 0.5;
  }

  &__empty-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-2);
    margin: 0 0 6px;
  }

  &__empty-hint {
    font-size: 13px;
    color: var(--text-3);
    margin: 0;
  }

  // ── Viewer ──
  &__viewer {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    z-index: 10;
    animation: viewerIn 0.2s ease;
  }

  &__viewer-bar {
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    gap: 8px;
  }

  &__viewer-back {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border: none;
    background: none;
    color: var(--text-2);
    font-size: 13px;
    cursor: pointer;
    border-radius: var(--radius);
    transition: all 0.2s;
    flex-shrink: 0;

    .segoicon {
      font-size: 14px;
    }

    &:hover {
      background: var(--surface-hover);
      color: var(--text-1);
    }
  }

  &__viewer-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
    justify-content: center;
  }

  &__viewer-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__viewer-pos {
    font-size: 11px;
    color: var(--text-3);
    white-space: nowrap;
    background: var(--surface-hover);
    padding: 2px 8px;
    border-radius: 10px;
  }

  &__viewer-tools {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;

    button {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      color: var(--text-2);
      cursor: pointer;
      border-radius: var(--radius);
      transition: all 0.15s;

      .segoicon {
        font-size: 14px;
      }

      &:hover {
        background: var(--surface-hover);
        color: var(--text-1);
      }
    }
  }

  &__viewer-scale {
    font-size: 11px;
    color: var(--text-3);
    min-width: 38px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  &__viewer-divider {
    width: 1px;
    height: 18px;
    background: var(--border);
    margin: 0 4px;
  }

  &__viewer-danger {
    &:hover {
      background: var(--danger-soft) !important;
      color: var(--danger) !important;
    }
  }

  &__viewer-stage {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background-image: linear-gradient(45deg, var(--surface-hover) 25%, transparent 25%),
      linear-gradient(-45deg, var(--surface-hover) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--surface-hover) 75%),
      linear-gradient(-45deg, transparent 75%, var(--surface-hover) 75%);
    background-size: 16px 16px;
    background-position:
      0 0,
      0 8px,
      8px -8px,
      -8px 0;
  }

  &__viewer-img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    border-radius: 4px;
    box-shadow: var(--shadow-3);
    transition: transform 0.15s ease;
    z-index: 1;
  }

  &__viewer-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--text-3);

    .segoicon {
      font-size: 36px;
    }
    p {
      margin: 0;
      font-size: 13px;
    }
  }

  &__viewer-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: var(--surface);
    color: var(--text-2);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: var(--shadow-2);
    z-index: 2;
    transition: all 0.2s;

    .segoicon {
      font-size: 14px;
    }

    &:hover {
      background: var(--surface-hover);
      color: var(--text-1);
      transform: translateY(-50%) scale(1.08);
    }

    &--left {
      left: 14px;
    }
    &--right {
      right: 14px;
    }
  }

  // ── Upload ──
  &__upload {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
  }

  &__upload-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    max-width: 440px;
    width: 100%;
  }

  &__upload-heading {
    text-align: center;
  }

  &__upload-title {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-1);
    margin-bottom: 6px;
  }

  &__upload-subtitle {
    font-size: 13px;
    color: var(--text-3);
  }

  &__upload-drop {
    width: 100%;
    padding: 44px 28px;
    border: 2px dashed var(--border);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    transition: all 0.3s;
    background: var(--surface);

    &:hover {
      border-color: var(--accent);
      background: var(--accent-soft);

      .picture-app__upload-icon-circle {
        background: var(--accent);
        color: #fff;
        transform: translateY(-2px);
      }
    }
  }

  &__upload-icon-circle {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--surface-hover);
    color: var(--text-3);
    transition: all 0.3s;

    .segoicon {
      font-size: 22px;
    }
  }

  &__upload-text {
    font-size: 14px;
    color: var(--text-2);
  }

  &__upload-link {
    color: var(--accent);
    font-weight: 500;
    margin-left: 2px;
  }

  &__upload-hint {
    font-size: 12px;
    color: var(--text-3);
  }
}

@keyframes viewerIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
