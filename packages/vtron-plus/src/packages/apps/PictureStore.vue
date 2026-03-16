<template>
  <div class="g" :class="{ 'g--dark': isDarkTheme }">
    <!-- Activity Bar -->
    <div class="g-activity">
      <div class="g-activity__top">
        <div
          class="g-activity__icon"
          :class="{ 'g-activity__icon--active': sidebarView === 'explorer' }"
          @click="toggleSidebar('explorer')"
          title="资源管理器"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          >
            <path d="M3 7h18M3 12h18M3 17h18" stroke-linecap="round" />
            <rect x="3" y="3" width="7" height="4" rx="1" fill="currentColor" stroke="none" opacity="0.5" />
          </svg>
        </div>
        <div
          class="g-activity__icon"
          :class="{ 'g-activity__icon--active': sidebarView === 'upload' }"
          @click="toggleSidebar('upload')"
          title="上传图片"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
      </div>
      <div class="g-activity__bottom">
        <div class="g-activity__icon" @click="toggleTheme" :title="isDarkTheme ? '亮色模式' : '暗色模式'">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          >
            <template v-if="isDarkTheme">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </template>
            <path v-else d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <div v-if="sidebarVisible" class="g-sidebar">
      <template v-if="sidebarView === 'explorer'">
        <div class="g-sidebar__header">资源管理器</div>
        <div class="g-sidebar__section">
          <div class="g-sidebar__section-head" @click="explorerExpanded = !explorerExpanded">
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="currentColor"
              :style="{ transform: explorerExpanded ? 'rotate(90deg)' : '' }"
            >
              <path d="M8 5l8 7-8 7z" />
            </svg>
            <span>PHOTO</span>
            <span class="g-sidebar__badge">{{ photoList.length }}</span>
          </div>
          <div v-if="explorerExpanded" class="g-sidebar__list">
            <div
              v-for="(item, idx) in photoList"
              :key="item.path"
              class="g-sidebar__item"
              :class="{ 'g-sidebar__item--active': viewerOpen && currentIndex === idx }"
              @click="openViewer(idx)"
            >
              <img v-if="thumbnails[item.path]" :src="thumbnails[item.path]" class="g-sidebar__thumb" />
              <div v-else class="g-sidebar__thumb-placeholder"></div>
              <span class="g-sidebar__name">{{ item.name }}</span>
            </div>
            <div v-if="photoList.length === 0" class="g-sidebar__empty">暂无图片</div>
          </div>
        </div>
      </template>
      <template v-if="sidebarView === 'upload'">
        <div class="g-sidebar__header">上传图片</div>
        <div class="g-sidebar__upload">
          <FileUploader :accept="'image/*'" @change="upload">
            <div class="g-sidebar__drop">
              <svg
                viewBox="0 0 24 24"
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p>拖拽或点击上传</p>
              <span>jpg, png, gif, webp</span>
            </div>
          </FileUploader>
        </div>
      </template>
    </div>

    <!-- Resize Handle -->
    <div v-if="sidebarVisible" class="g-sash" @mousedown="onSashDown"></div>

    <!-- Main Area -->
    <div class="g-main">
      <!-- Tabs -->
      <div class="g-tabs">
        <div class="g-tabs__item" :class="{ 'g-tabs__item--active': !viewerOpen }" @click="closeViewer">
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span>图库</span>
        </div>
        <div v-if="viewerOpen && photoList[currentIndex]" class="g-tabs__item g-tabs__item--active">
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>{{ photoList[currentIndex]?.name }}</span>
          <div class="g-tabs__close" @click.stop="closeViewer">×</div>
        </div>
      </div>

      <!-- Editor Content -->
      <div class="g-editor">
        <!-- Grid View (Welcome) -->
        <div v-if="!viewerOpen" class="g-grid-wrap">
          <div v-if="photoList.length === 0" class="g-welcome">
            <svg
              viewBox="0 0 24 24"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              opacity="0.3"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p class="g-welcome__title">暂无图片</p>
            <p class="g-welcome__hint">点击左侧上传按钮添加图片</p>
          </div>
          <div v-else class="g-grid">
            <div
              class="g-grid__card"
              v-for="(item, index) in photoList"
              :key="item.path"
              @click="openViewer(index)"
            >
              <div class="g-grid__preview">
                <img v-if="thumbnails[item.path]" :src="thumbnails[item.path]" draggable="false" />
                <div v-else class="g-grid__loading"></div>
              </div>
              <div class="g-grid__name">{{ item.name }}</div>
            </div>
          </div>
        </div>

        <!-- Image Viewer -->
        <div v-if="viewerOpen" class="g-viewer">
          <div class="g-viewer__toolbar">
            <button @click="zoomOut" title="缩小">−</button>
            <span class="g-viewer__scale">{{ Math.round(scale * 100) }}%</span>
            <button @click="zoomIn" title="放大">+</button>
            <div class="g-viewer__sep"></div>
            <button @click="fitView" title="适应窗口">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
            <button @click="rotateImage" title="旋转">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
              </svg>
            </button>
            <div class="g-viewer__sep"></div>
            <button class="g-viewer__danger" @click="deletePhoto" title="删除">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>

          <div class="g-viewer__canvas" @wheel.prevent="handleWheel">
            <button class="g-viewer__arrow g-viewer__arrow--l" @click="prevPhoto" v-if="photoList.length > 1">
              ‹
            </button>
            <img
              v-if="viewerContent"
              :src="viewerContent"
              draggable="false"
              class="g-viewer__img"
              :style="{ transform: `scale(${scale}) rotate(${rotation}deg)` }"
            />
            <div v-else class="g-viewer__placeholder">加载中...</div>
            <button class="g-viewer__arrow g-viewer__arrow--r" @click="nextPhoto" v-if="photoList.length > 1">
              ›
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="g-status">
      <span>{{ photoList.length }} 张图片</span>
      <span v-if="viewerOpen && photoList[currentIndex]"
        >{{ currentIndex + 1 }} / {{ photoList.length }}</span
      >
      <span class="g-status__right">{{ viewerOpen ? '查看器' : '图库' }}</span>
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

const sidebarView = ref<'explorer' | 'upload'>('explorer');
const sidebarVisible = ref(true);
const sidebarWidth = ref(220);
const explorerExpanded = ref(true);

const viewerOpen = ref(false);
const viewerContent = ref('');
const currentIndex = ref(0);
const scale = ref(1);
const rotation = ref(0);
const isDarkTheme = ref(true);

function toggleSidebar(view: 'explorer' | 'upload') {
  if (sidebarView.value === view && sidebarVisible.value) {
    sidebarVisible.value = false;
  } else {
    sidebarView.value = view;
    sidebarVisible.value = true;
  }
}

function onSashDown(e: MouseEvent) {
  const startX = e.clientX;
  const startW = sidebarWidth.value;
  const onMove = (ev: MouseEvent) => {
    const w = startW + ev.clientX - startX;
    sidebarWidth.value = Math.max(140, Math.min(400, w));
  };
  const onUp = () => {
    removeEventListener('mousemove', onMove);
    removeEventListener('mouseup', onUp);
  };
  addEventListener('mousemove', onMove);
  addEventListener('mouseup', onUp);
}

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
  currentIndex.value = currentIndex.value > 0 ? currentIndex.value - 1 : photoList.value.length - 1;
  scale.value = 1;
  rotation.value = 0;
  loadViewerImage(currentIndex.value);
}

function nextPhoto() {
  currentIndex.value = currentIndex.value < photoList.value.length - 1 ? currentIndex.value + 1 : 0;
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
  if (Math.sign(event.deltaY) > 0) zoomOut();
  else zoomIn();
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
    await sys.fs.writeFile(join(sys._options.userLocation || '', 'Photo', file.name), base64);
    tar.value = '';
    await refreshPhotoList();
    sidebarView.value = 'explorer';
    sys.createNotify({ title: '上传成功', content: `${file.name} 已添加到图库` });
  };
}

function toggleTheme() {
  isDarkTheme.value = !isDarkTheme.value;
}
</script>

<style scoped lang="scss">
.g {
  --act-bg: #2c2c2c;
  --act-fg: #858585;
  --act-active: #fff;
  --act-indicator: #007acc;
  --sb-bg: #252526;
  --sb-fg: #ccc;
  --sb-header: #bbb;
  --sb-hover: #2a2d2e;
  --sb-active: #37373d;
  --tab-bg: #1e1e1e;
  --tab-active-bg: #1e1e1e;
  --tab-inactive-bg: #2d2d2d;
  --tab-fg: #969696;
  --tab-active-fg: #fff;
  --tab-border: #252526;
  --editor-bg: #1e1e1e;
  --status-bg: #007acc;
  --status-fg: #fff;
  --card-bg: #2d2d2d;
  --card-hover: #333;
  --card-name: #ccc;
  --text-dim: #666;
  --border: #3c3c3c;
  --danger: #f44747;
  --toolbar-bg: #252526;

  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  color: var(--sb-fg);

  &--dark {
    /* already dark by default, swap to light */
  }
}

.g:not(.g--dark) {
  --act-bg: #2c2c2c;
  --act-fg: #858585;
  --act-active: #fff;
  --act-indicator: #007acc;
  --sb-bg: #f3f3f3;
  --sb-fg: #333;
  --sb-header: #666;
  --sb-hover: #e8e8e8;
  --sb-active: #d6ebff;
  --tab-bg: #ececec;
  --tab-active-bg: #fff;
  --tab-inactive-bg: #ececec;
  --tab-fg: #666;
  --tab-active-fg: #333;
  --tab-border: #e0e0e0;
  --editor-bg: #fff;
  --status-bg: #007acc;
  --status-fg: #fff;
  --card-bg: #f5f5f5;
  --card-hover: #e8e8e8;
  --card-name: #444;
  --text-dim: #999;
  --border: #e0e0e0;
  --danger: #e51400;
  --toolbar-bg: #f3f3f3;
}

// ── Activity Bar ──
.g-activity {
  width: 48px;
  height: calc(100% - 22px);
  background: var(--act-bg);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-shrink: 0;

  &__top,
  &__bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--act-fg);
    cursor: pointer;
    position: relative;
    transition: color 0.15s;

    &:hover {
      color: var(--act-active);
    }

    &--active {
      color: var(--act-active);
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 25%;
        height: 50%;
        width: 2px;
        background: var(--act-indicator);
      }
    }
  }
}

// ── Sidebar ──
.g-sidebar {
  width: v-bind("sidebarWidth + 'px'");
  height: calc(100% - 22px);
  background: var(--sb-bg);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;

  &__header {
    height: 35px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--sb-header);
    flex-shrink: 0;
  }

  &__section-head {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    user-select: none;
    color: var(--sb-fg);

    svg {
      transition: transform 0.15s;
    }

    .g-sidebar__badge {
      margin-left: auto;
      font-size: 10px;
      background: var(--act-indicator);
      color: #fff;
      padding: 0 6px;
      border-radius: 8px;
      font-weight: 500;
    }
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    &::-webkit-scrollbar {
      width: 5px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--act-fg);
      border-radius: 3px;
    }
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px 3px 20px;
    cursor: pointer;
    transition: background 0.1s;
    white-space: nowrap;

    &:hover {
      background: var(--sb-hover);
    }
    &--active {
      background: var(--sb-active);
    }
  }

  &__thumb {
    width: 18px;
    height: 18px;
    object-fit: cover;
    border-radius: 2px;
    flex-shrink: 0;
  }

  &__thumb-placeholder {
    width: 18px;
    height: 18px;
    background: var(--border);
    border-radius: 2px;
    flex-shrink: 0;
  }

  &__name {
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__empty {
    padding: 12px 20px;
    font-size: 12px;
    color: var(--text-dim);
  }

  &__upload {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  &__drop {
    width: 100%;
    padding: 24px 12px;
    border: 1.5px dashed var(--border);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--act-fg);

    p {
      margin: 0;
      font-size: 12px;
      color: var(--sb-fg);
    }
    span {
      font-size: 10px;
      color: var(--text-dim);
    }

    &:hover {
      border-color: var(--act-indicator);
      color: var(--act-indicator);
    }
  }
}

// ── Resize Sash ──
.g-sash {
  width: 4px;
  height: calc(100% - 22px);
  cursor: ew-resize;
  background: transparent;
  flex-shrink: 0;
  margin-left: -2px;
  margin-right: -2px;
  z-index: 5;
  &:hover {
    background: var(--act-indicator);
  }
}

// ── Main Area ──
.g-main {
  flex: 1;
  min-width: 0;
  height: calc(100% - 22px);
  display: flex;
  flex-direction: column;

  background: var(--editor-bg);
}

// ── Tabs ──
.g-tabs {
  height: 38px;
  display: flex;
  align-items: stretch;
  background: var(--tab-bg);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 14px;
    font-size: 12px;
    color: var(--tab-fg);
    cursor: pointer;
    border-right: 1px solid var(--tab-border);
    background: var(--tab-inactive-bg);
    white-space: nowrap;
    transition: all 0.1s;
    user-select: none;

    &--active {
      background: var(--tab-active-bg);
      color: var(--tab-active-fg);
      border-bottom: 1px solid var(--tab-active-bg);
      margin-bottom: -1px;
    }

    &:hover:not(&--active) {
      background: var(--card-hover);
    }
  }

  &__close {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    font-size: 15px;
    line-height: 1;
    margin-left: 4px;
    &:hover {
      background: rgba(128, 128, 128, 0.3);
    }
  }
}

// ── Editor / Grid ──
.g-editor {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.g-grid-wrap {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--act-fg);
    border-radius: 3px;
  }
}

.g-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-dim);

  &__title {
    font-size: 16px;
    margin: 16px 0 6px;
  }
  &__hint {
    font-size: 12px;
    opacity: 0.7;
  }
}

.g-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;

  &__card {
    border-radius: 6px;
    overflow: hidden;
    background: var(--card-bg);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      .g-grid__preview img {
        transform: scale(1.05);
      }
    }
  }

  &__preview {
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    background: var(--border);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }
  }

  &__loading {
    width: 100%;
    height: 100%;
    background: var(--border);
  }

  &__name {
    padding: 6px 8px;
    font-size: 11px;
    color: var(--card-name);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// ── Viewer ──
.g-viewer {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--editor-bg);

  &__toolbar {
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 0 8px;
    background: var(--toolbar-bg);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;

    button {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      color: var(--sb-fg);
      cursor: pointer;
      border-radius: 4px;
      font-size: 16px;
      font-weight: bold;
      transition: all 0.1s;

      &:hover {
        background: var(--sb-hover);
      }
    }
  }

  &__scale {
    font-size: 11px;
    color: var(--text-dim);
    min-width: 38px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  &__sep {
    width: 1px;
    height: 16px;
    background: var(--border);
    margin: 0 4px;
  }

  &__danger:hover {
    background: rgba(244, 71, 71, 0.15) !important;
    color: var(--danger) !important;
  }

  &__canvas {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background-image: linear-gradient(45deg, var(--card-bg) 25%, transparent 25%),
      linear-gradient(-45deg, var(--card-bg) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--card-bg) 75%),
      linear-gradient(-45deg, transparent 75%, var(--card-bg) 75%);
    background-size: 16px 16px;
    background-position:
      0 0,
      0 8px,
      8px -8px,
      -8px 0;
  }

  &__img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    transition: transform 0.15s;
    z-index: 1;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  &__placeholder {
    color: var(--text-dim);
    font-size: 13px;
  }

  &__arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: var(--card-bg);
    color: var(--sb-fg);
    border-radius: 50%;
    cursor: pointer;
    font-size: 20px;
    z-index: 2;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.15s;

    &:hover {
      background: var(--card-hover);
      transform: translateY(-50%) scale(1.1);
    }

    &--l {
      left: 12px;
    }
    &--r {
      right: 12px;
    }
  }
}

// ── Status Bar ──
.g-status {
  width: 100%;
  height: 22px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 10px;
  background: var(--status-bg);
  color: var(--status-fg);
  font-size: 11px;
  flex-shrink: 0;
  box-sizing: border-box;
  user-select: none;

  &__right {
    margin-left: auto;
  }
}
</style>
