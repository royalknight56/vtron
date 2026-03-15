<!--
 * @Author: Royal
 * @LastEditTime: 2022-01-27 15:13:59
 * @Description: 
 * @FilePath: /publishTest/src/components/apps/MyComputer.vue
-->
<template>
  <div class="computer-container">
  <div class="uper">
    <div class="group">
      <!-- <div class="button">文件</div> -->
      <!-- <div class="button">计算机</div> -->
      <div class="button" @click="backFolder()">{{ i18n('back') }}</div>
      <!-- 查看 -->
      <div class="button" @click="popoverChange()">{{ i18n('view') }}</div>
      <div class="button" :class="{ 'button-active': showFilterBar }" @click="showFilterBar = !showFilterBar">{{ i18n('filter.type') }}</div>
      <div class="button" :class="{ 'button-active': showPreview }" @click="togglePreview()">{{ i18n('preview') }}</div>
    </div>
    <div v-if="isPopoverView" class="up-pop">
      <UpPopover v-model="chosenView"></UpPopover>
    </div>
    <NavBar
      v-model="router_url"
      @backFolder="backFolder()"
      @refresh="handleNavRefresh"
      @search="handleNavSearch"
      @searchInput="handleSearchInput"
      @changeHistory="handleHistoryChange"
    ></NavBar>
    <div v-if="showFilterBar" class="filter-bar">
      <div
        v-for="filter in typeFilterOptions"
        :key="filter.key"
        class="filter-chip"
        :class="{ active: activeFilter === filter.key }"
        @click="setFilter(filter.key)"
      >
        {{ filter.label }}
      </div>
      <span v-if="activeFilter !== 'all' || searchKeyword" class="filter-result-count">
        {{ filteredList.length }} {{ i18n('filter.all') === '全部' ? '项' : 'items' }}
      </span>
    </div>
  </div>
  <div class="main" @click="handleOuterClick">
    <div
      class="left-tree"
      :style="{
        width: leftWidth + 'px',
      }"
    >
      <QuickLink :on-open="onTreeOpen"></QuickLink>
      <FileTree
        :chosen-path="chosenTreePath"
        mode="list"
        :on-open="onTreeOpen"
        :on-refresh="onListRefresh"
        :file-list="rootFileList"
        :key="random"
      >
      </FileTree>
      <div class="left-handle" @mousedown="leftHandleDown"></div>
    </div>
    <div
      class="desk-outer"
      @contextmenu.self="showOuterMenu($event)"
      @dragenter.prevent
      @dragover.prevent
      @drop.stop="dragFileToDrop($event, router_url)"
      @click.self="onBackClick"
      @mousedown="backgroundDown"
    >
      <template v-if="isRootView">
        <div class="volume-view">
          <div class="volume-section-title">{{ i18n('devices.and.drives') }}</div>
          <div class="volume-grid">
            <div
              v-for="vol in filteredList"
              :key="vol.path"
              class="volume-card"
              :class="{ 'volume-card-selected': selectedFile?.path === vol.path }"
              @dblclick="openFolder(vol)"
              @click="onFileSelect(vol)"
              @contextmenu.stop.prevent="handleVolumeRightClick($event, vol)"
            >
              <div class="volume-card-icon">
                <img :src="volumeicon" />
              </div>
              <div class="volume-card-info">
                <div class="volume-card-name">{{ i18n('local.disk') }} ({{ getVolumeLetter(vol) }}:)</div>
                <div class="volume-card-bar">
                  <div class="volume-card-bar-fill" :style="{ width: getVolumeUsage(vol) + '%' }"></div>
                </div>
                <div class="volume-card-space">{{ getVolumeLetter(vol) }}:</div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <FileList
          :on-chosen="onChosen"
          :on-refresh="onListRefresh"
          :on-open="openFolder"
          :on-select="onFileSelect"
          :file-list="filteredList"
          theme="blue"
          :mode="chosenView"
        >
        </FileList>

        <div draggable="true" class="desk-item" v-if="creating">
          <div class="item_img">
            <img draggable="false" width="50" :src="foldericon" />
          </div>
          <input class="item_input" v-model="createInput" @blur="creatingEditEnd" />
        </div>
      </template>
      <Chosen></Chosen>
    </div>
    <div v-if="showPreview" class="preview-panel">
      <div v-if="previewInfo" class="preview-content">
        <div class="preview-header">
          <img
            v-if="previewInfo.isImage && previewInfo.content"
            :src="previewInfo.content"
            class="preview-thumbnail"
          />
          <img v-else :src="previewInfo.isVolume ? volumeicon : previewInfo.isDir ? foldericon : fileicon" class="preview-icon" />
          <div class="preview-name">{{ previewInfo.name }}</div>
        </div>
        <div class="preview-details">
          <div class="preview-row">
            <span class="preview-label">{{ i18n('preview.type') }}</span>
            <span class="preview-value">{{ previewInfo.isDir ? i18n('preview.folder') : previewInfo.ext || i18n('preview.file') }}</span>
          </div>
          <div v-if="!previewInfo.isDir && previewInfo.size !== undefined" class="preview-row">
            <span class="preview-label">{{ i18n('preview.size') }}</span>
            <span class="preview-value">{{ formatSize(previewInfo.size) }}</span>
          </div>
          <div v-if="previewInfo.mtime" class="preview-row">
            <span class="preview-label">{{ i18n('preview.modified') }}</span>
            <span class="preview-value">{{ previewInfo.mtime }}</span>
          </div>
          <div v-if="previewInfo.birthtime" class="preview-row">
            <span class="preview-label">{{ i18n('preview.created') }}</span>
            <span class="preview-value">{{ previewInfo.birthtime }}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">{{ i18n('preview.path') }}</span>
            <span class="preview-value preview-path">{{ previewInfo.path }}</span>
          </div>
        </div>
        <div v-if="previewInfo.content && !previewInfo.isImage" class="preview-text">
          <pre>{{ previewInfo.content }}</pre>
        </div>
      </div>
      <div v-else class="preview-empty">
        {{ i18n('preview.select') }}
      </div>
    </div>
  </div>
  <div class="status-bar">
    <span class="status-left">
      {{ statusInfo.total }} {{ i18n('status.items') }}
      <template v-if="activeFilter !== 'all' || searchKeyword">
        ({{ currentList.length }} {{ i18n('status.items') }})
      </template>
    </span>
    <span class="status-right">
      <span v-if="statusInfo.folders > 0">{{ statusInfo.folders }} {{ i18n('status.folders') }}</span>
      <span v-if="statusInfo.folders > 0 && statusInfo.files > 0" class="status-sep">|</span>
      <span v-if="statusInfo.files > 0">{{ statusInfo.files }} {{ i18n('status.files') }}</span>
    </span>
  </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, inject, computed } from 'vue';
import foldericon from '@packages/assets/folder.png';
import fileicon from '@packages/assets/unknown.png';
import volumeicon from '@packages/assets/volume-local.png';
import FileList from '@/packages/computer/application/components/FileList.vue';
import FileTree from '@/packages/computer/application/components/FileTree.vue';
import UpPopover from './components/UpPopover.vue';
import { System, VtronFileWithoutContent, dirname } from '@packages/kernel';
import { i18n } from '@/packages/computer/i18n';
import { useFileDrag } from '@/packages/computer/hook/useFileDrag';
import { useComputer } from './hooks/useComputer';
import { Rect, useRectChosen } from '@/packages/computer/hook/useRectChosen';
import { BrowserWindow } from '@/packages/services';
import NavBar from './components/NavBar.vue';
import QuickLink from './components/QuickLink.vue';
import VolumeProps from './components/VolumeProps.vue';
import { createDesktopContextMenu } from '@/packages/computer/utils/createContextMenu';

const { choseStart, chosing, choseEnd, getRect, Chosen } = useRectChosen();

const browserWindow: BrowserWindow | undefined = inject('browserWindow');
const config = browserWindow?.config;

const router_url = ref('');
const router_url_history = ref<Array<string>>([]);
const router_url_history_index = ref(0);
const currentList = ref<Array<VtronFileWithoutContent>>([]);

const system = inject<System>('system')!;
const { dragFileToDrop } = useFileDrag(system);

const EXT_MAP: Record<string, string[]> = {
  documents: ['.txt', '.doc', '.docx', '.pdf', '.json', '.md', '.csv', '.xml', '.html', '.htm', '.rtf', '.log', '.ini', '.cfg', '.yaml', '.yml', '.toml'],
  images: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.webp', '.ico', '.tiff', '.tif'],
  audio: ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.wma', '.m4a'],
  video: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'],
};
const typeFilterOptions = [
  { key: 'all', label: i18n('filter.all') },
  { key: 'documents', label: i18n('filter.documents') },
  { key: 'images', label: i18n('filter.images') },
  { key: 'audio', label: i18n('filter.audio') },
  { key: 'video', label: i18n('filter.video') },
  { key: 'folders', label: i18n('filter.folders') },
];
const activeFilter = ref('all');
const searchKeyword = ref('');
const showFilterBar = ref(false);

function getExtension(filePath: string): string {
  const name = filePath.split('/').pop() || '';
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex <= 0) return '';
  return name.substring(dotIndex).toLowerCase();
}

const filteredList = computed(() => {
  let list = currentList.value;
  if (activeFilter.value !== 'all') {
    if (activeFilter.value === 'folders') {
      list = list.filter((f) => f.isDirectory);
    } else {
      const exts = EXT_MAP[activeFilter.value];
      if (exts) {
        list = list.filter((f) => !f.isDirectory && exts.includes(getExtension(f.path)));
      }
    }
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase();
    list = list.filter((f) => {
      const name = (f.path.split('/').pop() || '').toLowerCase();
      return name.includes(kw);
    });
  }
  return list;
});

const statusInfo = computed(() => {
  const list = filteredList.value;
  const folders = list.filter((f) => f.isDirectory).length;
  return { total: list.length, folders, files: list.length - folders };
});

function setFilter(key: string) {
  activeFilter.value = key;
}
function handleSearchInput(keyword: string) {
  searchKeyword.value = keyword;
}

interface PreviewInfo {
  name: string;
  path: string;
  isDir: boolean;
  isVolume: boolean;
  ext: string;
  size?: number;
  mtime?: string;
  birthtime?: string;
  content?: string;
  isImage: boolean;
}

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.webp', '.ico'];
const showPreview = ref(false);
const previewInfo = ref<PreviewInfo | null>(null);
const selectedFile = ref<VtronFileWithoutContent | null>(null);

function togglePreview() {
  showPreview.value = !showPreview.value;
  if (showPreview.value && selectedFile.value) {
    loadPreview(selectedFile.value);
  }
}

function onFileSelect(file: VtronFileWithoutContent) {
  selectedFile.value = file;
  if (showPreview.value) {
    loadPreview(file);
  }
}

async function loadPreview(file: VtronFileWithoutContent) {
  const stat = await system.fs.stat(file.path);
  if (!stat) {
    previewInfo.value = null;
    return;
  }

  const name = file.path.split('/').pop() || '';
  const ext = getExtension(file.path);
  const isImage = IMAGE_EXTS.includes(ext);

  const pathParts = file.path.split('/').filter(Boolean);
  const isVolume = file.isDirectory && pathParts.length === 1;

  const info: PreviewInfo = {
    name,
    path: file.path,
    isDir: file.isDirectory,
    isVolume,
    ext: ext ? ext.substring(1).toUpperCase() : '',
    size: stat.size,
    mtime: stat.mtime ? new Date(stat.mtime).toLocaleString() : undefined,
    birthtime: stat.birthtime ? new Date(stat.birthtime).toLocaleString() : undefined,
    isImage: false,
  };

  if (!file.isDirectory) {
    try {
      const content = await system.fs.readFile(file.path);
      if (content !== null && content !== undefined) {
        if (isImage && typeof content === 'string' && content.startsWith('data:')) {
          info.content = content;
          info.isImage = true;
        } else if (typeof content === 'string') {
          info.content = content.length > 1000 ? content.substring(0, 1000) + '...' : content;
        }
      }
    } catch {
      // ignore read errors
    }
  }

  previewInfo.value = info;
}

const isRootView = computed(() => {
  const url = router_url.value;
  return url === '/' || url === '';
});

function getVolumeLetter(file: VtronFileWithoutContent): string {
  return file.path.split('/').filter(Boolean)[0] || '';
}

function getVolumeUsage(_file: VtronFileWithoutContent): number {
  return 30 + Math.abs(((_file.path.charCodeAt(1) || 0) * 17) % 50);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

const setRouter = function (path: string) {
  router_url.value = path;
  if (router_url_history_index.value <= router_url_history.value.length - 1) {
    router_url_history.value = router_url_history.value.slice(0, router_url_history_index.value + 1);
  }
  router_url_history_index.value = router_url_history.value.length;
  router_url_history.value.push(path);
};
const { refersh, createFolder, backFolder, openFolder, onComputerMount } = useComputer({
  setRouter: setRouter,
  getRouter() {
    return router_url.value;
  },
  setFileList(list) {
    currentList.value = list;
    previewInfo.value = null;
    selectedFile.value = null;
  },
  openFile(path) {
    system?.openFile(path);
  },
  rmdir(path) {
    return system.fs.rmdir(path);
  },
  mkdir(path) {
    return system.fs.mkdir(path);
  },
  readdir(path) {
    return system.fs.readdir(path);
  },
  exists(path) {
    return system.fs.exists(path);
  },
  isDirectory(file) {
    return file.isDirectory;
  },
  notify(title, content) {
    system.createNotify({
      title,
      content,
    });
  },
  search(keyword) {
    return system.fs.search(keyword);
  },
});
function handleHistoryChange(offset: number) {
  if (router_url_history_index.value + offset < 0) return;
  if (router_url_history_index.value + offset > router_url_history.value.length - 1) return;
  router_url_history_index.value = router_url_history_index.value + offset;
  router_url.value = router_url_history.value[router_url_history_index.value];

  refersh();
}
const leftWidth = ref(200);
function leftHandleDown(e: MouseEvent) {
  const startX = e.clientX;
  const startWidth = leftWidth.value;
  addEventListener('mousemove', leftHandleMove);
  addEventListener('mouseup', leftHandleUp);
  function leftHandleMove(e: MouseEvent) {
    const moveX = e.clientX - startX;
    if (startWidth + moveX < 100) return;
    if (startWidth + moveX > 500) return;
    leftWidth.value = startWidth + moveX;
  }
  function leftHandleUp() {
    removeEventListener('mousemove', leftHandleMove);
    removeEventListener('mouseup', leftHandleUp);
  }
}

const rootFileList = ref<Array<VtronFileWithoutContent>>([]);
const random = ref(0);
onMounted(() => {
  if (config) {
    router_url.value = config.path;
  } else {
    router_url.value = '/';
  }
  onComputerMount();
  system.mountEvent('file.props.edit', async () => {
    refersh();
  });
  system.mountEvent('computerpop.hidden', () => {
    isPopoverView.value = false;
  });
  system.fs.readdir('/').then((file) => {
    if (file) {
      rootFileList.value = [...file];
      random.value = random.value + 1;
    }
  });
});

function handleOuterClick() {
  system.emitEvent('mycomputer.click');
}

function onListRefresh() {
  refersh();
  system.fs.readdir('/').then((file) => {
    if (file) {
      rootFileList.value = [...file];
    }
  });
}

/**------视图切换------ */
const isPopoverView = ref(false);
function popoverChange() {
  isPopoverView.value = !isPopoverView.value;
}

const chosenView = ref('icon');

/**------树状列表打开------ */
const chosenTreePath = ref('');
async function onTreeOpen(path: string) {
  chosenTreePath.value = path;
  const file = await system.fs.stat(path);
  if (file) {
    openFolder(file);
  }
}

/**------框选--------- */
let chosenCallback: (rect: Rect) => void = () => {
  //
};
function onChosen(callback: (rect: Rect) => void) {
  chosenCallback = callback;
}

function backgroundDown(e: MouseEvent) {
  choseStart(e);
  addEventListener('mousemove', backgroundMove);
  addEventListener('mouseup', backgroundUp);
}
function backgroundMove(e: MouseEvent) {
  chosing(e);
  const rectValue = getRect();
  if (rectValue) {
    chosenCallback(rectValue);
  }
}
function backgroundUp() {
  choseEnd();
  const rectValue = getRect();
  if (rectValue) {
    chosenCallback(rectValue);
  }
  removeEventListener('mousemove', backgroundMove);
  removeEventListener('mouseup', backgroundUp);
}

/* ------------ 新建文件夹 ------------*/
const createInput = ref(i18n('new.folder'));
const creating = ref(false);
function creatingEditEnd() {
  if (creating.value) {
    createFolder(createInput.value);
    creating.value = false;
    createInput.value = i18n('new.folder');
  }
}
function onBackClick() {
  creatingEditEnd();
}
/* ------------ 新建文件夹end ---------*/

function showOuterMenu(e: MouseEvent) {
  e.preventDefault();
  createDesktopContextMenu(system, e, router_url.value, () => {
    refersh();
  });
}
/* ------------ 路径输入框 ------------*/
async function handleNavRefresh(path: string) {
  if (path == '') return;
  if (path.startsWith('search:')) {
    setRouter(path);
    refersh();
    return;
  }

  const res = await system.fs.stat(path);
  if (res) {
    setRouter(path);
    refersh();
  } else {
    setRouter(dirname(path));
    refersh();
  }
}
async function handleNavSearch(path: string) {
  searchKeyword.value = '';
  setRouter('search:' + path);
  refersh();
}
/* ------------ 路径输入框end ---------*/

/* ------------ 卷右键菜单 ------------ */
function handleVolumeRightClick(e: MouseEvent, vol: VtronFileWithoutContent) {
  selectedFile.value = vol;
  if (showPreview.value) {
    loadPreview(vol);
  }
  const menu = [
    {
      label: i18n('open'),
      click: () => openFolder(vol),
    },
    {
      label: i18n('props'),
      click: () => openVolumeProps(vol),
    },
  ];
  system.buildFromTemplate(menu).popup(e);
}

function openVolumeProps(vol: VtronFileWithoutContent) {
  system
    .createWindow({
      title: `${i18n('local.disk')} (${getVolumeLetter(vol)}:) ${i18n('props')}`,
      content: VolumeProps,
      config: { content: vol.path },
      width: 380,
      height: 460,
      resizable: false,
      center: true,
    })
    .show();
}
/* ------------ 卷右键菜单end --------- */
</script>
<style lang="scss" scoped>
.computer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.uper {
  background-color: rgba(255, 235, 205, 0);
  font-size: 12px;
  font-weight: 300;
  --button-item-height: 30px;
  flex-shrink: 0;
}

.main {
  display: flex;
  flex: 1;
  min-height: 0;
  position: relative;

  .left-tree {
    position: relative;
    overflow-x: hidden;
    overflow-y: auto;
    width: var(--menulist-width);
    height: 100%;
    background-color: rgba(255, 255, 255, 0.1);
    border-right: 1px solid rgba(134, 134, 134, 0.267);
  }

  .left-handle {
    position: absolute;
    right: 0;
    top: 0;
    width: 4px;
    height: 100%;
    background: rgba(0, 0, 0, 0);
    cursor: ew-resize;
  }

  .desk-outer {
    flex: 1;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    align-content: flex-start;
    flex-wrap: wrap;
    position: relative;
    overflow-x: hidden;
  }
}

.desk-item {
  position: relative;
  cursor: default;
  box-sizing: border-box;
  width: 70px;
  height: 100px;
  background-color: rgba(119, 119, 119, 0);
  color: white;
  border: 1px solid rgba(0, 0, 0, 0);
}

.chosen {
  border: 1px dashed #3bdbff3d;
  background-color: #b9e3fd90;
}

.desk-item:hover {
  border: 1px solid rgba(149, 149, 149, 0.233);
  background-color: #b9e3fd5a;
}

.item_img {
  width: 50px;
  height: 40px;
  overflow: hidden;
  padding: 10px;
  text-align: center;
}

.item_img img {
  user-select: none;
}

.item_name {
  overflow: hidden;
  max-width: 200px;
  color: rgba(0, 0, 0, 0.664);
  text-align: center;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  user-select: none;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.item_input {
  width: 100%;
}

.group {
  display: flex;
  border-bottom: 1px solid rgba(134, 134, 134, 0.267);

  user-select: none;
}

.button {
  cursor: pointer;
  text-align: center;
  width: 50px;
  transition: all 0.1s;
  background: #ffffff;
  font-family: sans-serif;
  font-size: 12px;
  padding: 0px 4px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.1s;
  white-space: nowrap;
  user-select: none;
}

.button:hover {
  background-color: #1b6bad;
  color: white;
}

.button-active {
  background-color: #0f5a96;
  color: white;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-bottom: 1px solid rgba(134, 134, 134, 0.267);
  background-color: #fafbfc;
  user-select: none;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 1px 10px;
  border-radius: 12px;
  font-size: 11px;
  cursor: pointer;
  border: 1px solid #dcdcdc;
  background: #fff;
  color: #444;
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    background-color: #e8f4fd;
    border-color: #6ca9e7;
  }

  &.active {
    background-color: #0078d7;
    color: #fff;
    border-color: #0078d7;
  }
}

.filter-result-count {
  font-size: 11px;
  color: #666;
  margin-left: auto;
}

.status-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 22px;
  padding: 0 10px;
  font-size: 11px;
  color: #444;
  background-color: #f0f0f0;
  border-top: 1px solid rgba(134, 134, 134, 0.267);
  user-select: none;
}

.status-left {
  white-space: nowrap;
}

.status-right {
  white-space: nowrap;
}

.status-sep {
  margin: 0 6px;
  color: #bbb;
}

.volume-view {
  width: 100%;
  padding: 4px 12px;
  user-select: none;
}

.volume-section-title {
  font-size: 12px;
  color: #555;
  padding: 8px 0 6px;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 8px;
}

.volume-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.volume-card {
  display: flex;
  align-items: center;
  width: 220px;
  height: 70px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 2px;
  cursor: default;
  transition: all 0.1s;
  box-sizing: border-box;

  &:hover {
    background-color: #e5f3ff;
    border-color: #cce4f7;
  }

  &.volume-card-selected {
    background-color: #cce8ff;
    border-color: #99d1ff;
  }
}

.volume-card-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  margin-right: 10px;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.volume-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
}

.volume-card-name {
  font-size: 12px;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.volume-card-bar {
  width: 100%;
  height: 14px;
  background-color: #e6e6e6;
  border-radius: 0;
  overflow: hidden;
}

.volume-card-bar-fill {
  height: 100%;
  background-color: #26a0da;
  transition: width 0.3s;
}

.volume-card-space {
  font-size: 11px;
  color: #666;
}

.preview-panel {
  width: 220px;
  flex-shrink: 0;
  height: 100%;
  border-left: 1px solid rgba(134, 134, 134, 0.267);
  background-color: #fafbfc;
  overflow-y: auto;
  overflow-x: hidden;
  font-size: 12px;
}

.preview-content {
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px 10px;
  border-bottom: 1px solid rgba(134, 134, 134, 0.2);
}

.preview-thumbnail {
  max-width: 180px;
  max-height: 140px;
  object-fit: contain;
  border-radius: 4px;
  margin-bottom: 8px;
}

.preview-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 8px;
}

.preview-name {
  font-size: 13px;
  font-weight: 500;
  color: #222;
  text-align: center;
  word-break: break-all;
  line-height: 1.3;
}

.preview-details {
  padding: 8px 12px;
}

.preview-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 6px;
}

.preview-label {
  font-size: 11px;
  color: #888;
  margin-bottom: 1px;
}

.preview-value {
  font-size: 12px;
  color: #333;
  word-break: break-all;
}

.preview-path {
  font-size: 11px;
  color: #555;
}

.preview-text {
  border-top: 1px solid rgba(134, 134, 134, 0.2);
  padding: 8px 12px;

  pre {
    margin: 0;
    font-size: 11px;
    font-family: 'Consolas', 'Monaco', monospace;
    white-space: pre-wrap;
    word-break: break-all;
    color: #333;
    line-height: 1.4;
    max-height: 200px;
    overflow-y: auto;
  }
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 12px;
}
</style>
