<template>
  <div class="computer-container" @keydown="onWindowKey">
    <ComputerChrome
      :path="router_url"
      :title="windowTitle"
      :root="isRootView"
      :can-back="router_url_history_index > 0"
      :can-forward="router_url_history_index < router_url_history.length - 1"
      :has-selection="!!selectedFile"
      :can-create="canCreateHere"
      :view="chosenView"
      :show-preview="showPreview"
      :show-navigation="showNavigation"
      :show-filters="showFilterBar"
      @back="handleHistoryChange(-1)"
      @forward="handleHistoryChange(1)"
      @up="goUp"
      @refresh="onListRefresh"
      @navigate="handleNavRefresh"
      @search="handleNavSearch"
      @search-input="handleSearchInput"
      @view="chosenView = $event"
      @toggle-preview="togglePreview"
      @toggle-navigation="showNavigation = !showNavigation"
      @toggle-filters="showFilterBar = !showFilterBar"
      @open-selected="openSelected"
      @properties="showSelectedProperties"
      @create-folder="startCreatingFolder"
    />
    <div v-if="showFilterBar" class="filter-bar">
      <span>{{ i18n('computer.filter') }}：</span
      ><button
        v-for="filter in typeFilterOptions"
        :key="filter.key"
        :class="{ active: activeFilter === filter.key }"
        :aria-pressed="activeFilter === filter.key"
        @click="setFilter(filter.key)"
      >
        {{ filter.label }}
      </button>
    </div>
    <div class="main" @click="handleOuterClick">
      <aside
        v-if="showNavigation"
        class="left-tree"
        :style="{ width: leftWidth + 'px' }"
        :aria-label="i18n('recycle.bin.navigation.pane')"
      >
        <button class="nav-heading" :aria-expanded="quickExpanded" @click="quickExpanded = !quickExpanded">
          <span class="mdl tree-chevron" aria-hidden="true">{{ quickExpanded ? '\uE70D' : '\uE76C' }}</span
          ><img :src="quickAccessIcon" alt="" /><span>{{ i18n('recycle.bin.quick.access') }}</span>
        </button>
        <template v-if="quickExpanded"
          ><button
            v-for="item in quickFolders"
            :key="item.key"
            class="nav-item quick-child"
            :class="{ current: router_url === item.path }"
            :disabled="!item.available"
            @click="onTreeOpen(item.path)"
          >
            <img :src="item.navIcon" alt="" /><span>{{ item.label }}</span
            ><span class="mdl pin" aria-hidden="true">&#xE718;</span>
          </button></template
        >
        <button class="nav-item section-start" disabled>
          <span class="tree-indent"></span><img :src="oneDriveIcon" alt="" /><span>OneDrive</span>
        </button>
        <div class="nav-computer" :class="{ current: isRootView }">
          <button
            class="tree-toggle"
            :aria-label="i18n('computer')"
            :aria-expanded="computerExpanded"
            @click="computerExpanded = !computerExpanded"
          >
            <span class="mdl tree-chevron" aria-hidden="true">{{
              computerExpanded ? '\uE70D' : '\uE76C'
            }}</span></button
          ><button class="nav-main" @click="onTreeOpen('/')">
            <img :src="computerIcon" alt="" /><span>{{ i18n('computer') }}</span>
          </button>
        </div>
        <template v-if="computerExpanded"
          ><button
            v-for="item in standardFolders"
            :key="item.key"
            class="nav-item computer-child"
            :class="{ current: router_url === item.path }"
            :disabled="!item.available"
            @click="onTreeOpen(item.path)"
          >
            <span class="mdl tree-chevron" aria-hidden="true">&#xE76C;</span
            ><img :src="item.navIcon" alt="" /><span>{{ item.label }}</span></button
          ><button
            v-for="vol in rootFileList"
            :key="vol.path"
            class="nav-item computer-child"
            :class="{ current: router_url === vol.path }"
            @click="onTreeOpen(vol.path)"
          >
            <span class="mdl tree-chevron" aria-hidden="true">&#xE76C;</span
            ><img :src="getDriveIcon(vol)" alt="" /><span>{{ driveName(vol) }}</span>
          </button></template
        >
        <button class="nav-item section-start" disabled>
          <span class="mdl tree-chevron" aria-hidden="true">&#xE76C;</span
          ><img :src="networkIcon" alt="" /><span>{{ i18n('recycle.bin.network') }}</span>
        </button>
        <button
          v-if="notesAvailable"
          class="nav-item section-start"
          :class="{ current: router_url === userPath + 'Note' }"
          @click="onTreeOpen(userPath + 'Note')"
        >
          <span class="tree-indent"></span><img :src="foldericon" alt="" /><span>{{
            i18n('computer.notes')
          }}</span>
        </button>
        <div class="left-handle" @mousedown="leftHandleDown"></div>
      </aside>
      <div
        class="desk-outer"
        :class="{ 'root-view': isRootView, 'details-view': !isRootView && chosenView === 'detail' }"
        @contextmenu.self="showOuterMenu($event)"
        @dragenter.prevent
        @dragover.prevent
        @drop.stop.prevent="canCreateHere && dragFileToDrop($event, router_url)"
        @click.self="onBackClick"
        @mousedown="backgroundDown"
      >
        <div
          v-if="isRootView"
          class="volume-view"
          :class="{ 'compact-view': chosenView === 'list' || chosenView === 'detail' }"
          @mousedown.stop
          @contextmenu.self.prevent="showRootMenu"
        >
          <button
            class="section-heading"
            :aria-expanded="foldersExpanded"
            @click="foldersExpanded = !foldersExpanded"
          >
            <span class="mdl" aria-hidden="true">{{ foldersExpanded ? '\uE70D' : '\uE76C' }}</span
            ><span>{{ i18n('computer.folders') }} ({{ visibleFolders.length }})</span
            ><span class="section-line"></span>
          </button>
          <div v-if="foldersExpanded" class="folder-grid">
            <button
              v-for="item in visibleFolders"
              :key="item.key"
              class="folder-card"
              :class="{ selected: selectedFile?.path === item.path }"
              :disabled="!item.available"
              @click="selectShortcut(item)"
              @dblclick="onTreeOpen(item.path)"
              @keydown.enter.prevent="onTreeOpen(item.path)"
            >
              <img :src="item.icon" alt="" /><span>{{ item.label }}</span>
            </button>
          </div>
          <button
            class="section-heading"
            :aria-expanded="drivesExpanded"
            @click="drivesExpanded = !drivesExpanded"
          >
            <span class="mdl" aria-hidden="true">{{ drivesExpanded ? '\uE70D' : '\uE76C' }}</span
            ><span>{{ i18n('devices.and.drives') }} ({{ filteredList.length }})</span
            ><span class="section-line"></span>
          </button>
          <div v-if="drivesExpanded" class="volume-grid">
            <button
              v-for="vol in filteredList"
              :key="vol.path"
              class="volume-card"
              :class="{ selected: selectedFile?.path === vol.path }"
              @dblclick="openFolder(vol)"
              @keydown.enter.prevent="openFolder(vol)"
              @click="onFileSelect(vol)"
              @contextmenu.stop.prevent="handleVolumeRightClick($event, vol)"
            >
              <img :src="getDriveIcon(vol)" alt="" />
              <div class="volume-card-info">
                <span class="volume-card-name">{{ driveName(vol) }}</span
                ><span class="volume-card-bar" :aria-label="i18n('computer.capacity.unavailable')"></span
                ><span class="volume-card-space">{{ i18n('computer.capacity.unavailable') }}</span>
              </div>
            </button>
          </div>
          <p v-if="!visibleFolders.length && !filteredList.length" class="empty-message">
            {{ i18n('computer.no.results') }}
          </p>
        </div>
        <template v-else
          ><FileList
            explorer-details
            :on-chosen="onChosen"
            :on-refresh="onListRefresh"
            :on-open="openFolder"
            :on-select="onFileSelect"
            :file-list="filteredList"
            theme="blue"
            :mode="chosenView === 'tiles' ? 'icon' : chosenView"
          />
          <div v-if="creating" class="new-folder-item">
            <img :src="foldericon" alt="" /><input
              ref="newFolderInput"
              class="item_input"
              v-model="createInput"
              :aria-label="i18n('new.folder')"
              @keydown.enter.prevent="creatingEditEnd"
              @keydown.esc="creating = false"
              @blur="creatingEditEnd"
            />
          </div>
          <p v-if="!filteredList.length && !creating" class="empty-message">
            {{
              searchKeyword || router_url.startsWith('search:')
                ? i18n('computer.no.results')
                : i18n('computer.empty')
            }}
          </p>
        </template>
        <Chosen />
      </div>
      <div v-if="showPreview" class="preview-panel">
        <div v-if="previewInfo" class="preview-content">
          <div class="preview-header">
            <img
              v-if="previewInfo.isImage && previewInfo.content"
              :src="previewInfo.content"
              class="preview-thumbnail"
            />
            <img
              v-else
              :src="previewInfo.isVolume ? volumeicon : previewInfo.isDir ? foldericon : fileicon"
              class="preview-icon"
            />
            <div class="preview-name">{{ previewInfo.name }}</div>
          </div>
          <div class="preview-details">
            <div class="preview-row">
              <span class="preview-label">{{ i18n('preview.type') }}</span>
              <span class="preview-value">{{
                previewInfo.isDir ? i18n('preview.folder') : previewInfo.ext || i18n('preview.file')
              }}</span>
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
    <footer class="status-bar">
      <span
        >{{ isRootView ? visibleFolders.length + filteredList.length : statusInfo.total }}
        {{ i18n('status.items') }}</span
      ><span v-if="selectedFile">{{ i18n('recycle.bin.selected.items').replace('{count}', '1') }}</span
      ><span class="status-spacer"></span
      ><button
        :class="{ checked: chosenView === 'detail' }"
        :aria-label="i18n('detail.info')"
        :title="i18n('detail.info')"
        @click="chosenView = 'detail'"
      >
        <span class="mdl" aria-hidden="true">&#xE8FD;</span></button
      ><button
        :class="{ checked: chosenView !== 'detail' }"
        :aria-label="i18n('large.icon')"
        :title="i18n('large.icon')"
        @click="chosenView = 'icon'"
      >
        <span class="mdl" aria-hidden="true">&#xE8A9;</span>
      </button>
    </footer>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, onUnmounted, inject, computed, nextTick, watch } from 'vue';
import foldericon from '@packages/assets/folder.png';
import fileicon from '@packages/assets/unknown.png';
import volumeicon from '@packages/assets/volume-local.png';
import FileList from '@/packages/computer/application/components/FileList.vue';
import { System, VtronFileWithoutContent, dirname, normalize } from '@packages/kernel';
import { i18n } from '@/packages/computer/i18n';
import { useFileDrag } from '@/packages/computer/hook/useFileDrag';
import { useComputer } from './hooks/useComputer';
import { Rect, useRectChosen } from '@/packages/computer/hook/useRectChosen';
import { BrowserWindow } from '@/packages/services';
import ComputerChrome from './components/ComputerChrome.vue';
import { openPropsWindow } from '../components/fileOpt';
import VolumeProps from './components/VolumeProps.vue';
import { createDesktopContextMenu } from '@/packages/computer/utils/createContextMenu';

import computerIcon from '@packages/assets/recycle-bin/this-pc.png';
import quickAccessIcon from '@packages/assets/recycle-bin/quick-access.png';
import oneDriveIcon from '@packages/assets/recycle-bin/onedrive.png';
import networkIcon from '@packages/assets/recycle-bin/network.png';
import desktopIcon from '@packages/assets/my-computer/desktop.png';
import documentsIcon from '@packages/assets/my-computer/documents.png';
import downloadsIcon from '@packages/assets/my-computer/downloads.png';
import picturesIcon from '@packages/assets/my-computer/pictures.png';
import musicIcon from '@packages/assets/my-computer/music.png';
import videosIcon from '@packages/assets/my-computer/videos.png';
import objectsIcon from '@packages/assets/my-computer/objects-3d.png';
import localDriveIcon from '@packages/assets/my-computer/local-disk.png';
import systemDriveIcon from '@packages/assets/my-computer/system-disk.png';
import networkDriveIcon from '@packages/assets/my-computer/network-drive.png';
import desktopNav from '@packages/assets/recycle-bin/desktop.png';
import documentsNav from '@packages/assets/recycle-bin/documents.png';
import downloadsNav from '@packages/assets/recycle-bin/downloads.png';
import picturesNav from '@packages/assets/recycle-bin/pictures.png';
import musicNav from '@packages/assets/recycle-bin/music.png';
import videosNav from '@packages/assets/recycle-bin/videos.png';

const { choseStart, chosing, choseEnd, getRect, Chosen } = useRectChosen();

const browserWindow: BrowserWindow | undefined = inject('browserWindow');
const config = browserWindow?.config;

const router_url = ref('');
const router_url_history = ref<Array<string>>([]);
const router_url_history_index = ref(0);
const currentList = ref<Array<VtronFileWithoutContent>>([]);

const system = inject<System>('system')!;
const { dragFileToDrop } = useFileDrag(system);
const userPath = system._options.userLocation || '/C/Users/';
const showNavigation = ref(true);
const quickExpanded = ref(true);
const computerExpanded = ref(true);
const foldersExpanded = ref(true);
const drivesExpanded = ref(true);
const notesAvailable = ref(false);
interface StandardFolder {
  key: string;
  label: string;
  path: string;
  icon: string;
  navIcon: string;
  available: boolean;
}
const standardFolders = ref<StandardFolder[]>([
  {
    key: 'objects',
    label: i18n('computer.objects3d'),
    path: userPath + '3D Objects',
    icon: objectsIcon,
    navIcon: objectsIcon,
    available: false,
  },
  {
    key: 'desktop',
    label: i18n('recycle.bin.desktop'),
    path: userPath + 'Desktop',
    icon: desktopIcon,
    navIcon: desktopNav,
    available: false,
  },
  {
    key: 'documents',
    label: i18n('recycle.bin.documents'),
    path: userPath + 'Documents',
    icon: documentsIcon,
    navIcon: documentsNav,
    available: false,
  },
  {
    key: 'downloads',
    label: i18n('recycle.bin.downloads'),
    path: userPath + 'Downloads',
    icon: downloadsIcon,
    navIcon: downloadsNav,
    available: false,
  },
  {
    key: 'music',
    label: i18n('recycle.bin.music'),
    path: userPath + 'Music',
    icon: musicIcon,
    navIcon: musicNav,
    available: false,
  },
  {
    key: 'pictures',
    label: i18n('recycle.bin.pictures'),
    path: userPath + 'Photo',
    icon: picturesIcon,
    navIcon: picturesNav,
    available: false,
  },
  {
    key: 'videos',
    label: i18n('recycle.bin.videos'),
    path: userPath + 'Videos',
    icon: videosIcon,
    navIcon: videosNav,
    available: false,
  },
]);
const quickFolders = computed(() =>
  ['desktop', 'downloads', 'documents', 'pictures'].map(
    (key) => standardFolders.value.find((item) => item.key === key)!
  )
);
const visibleFolders = computed(() =>
  standardFolders.value.filter(
    (item) =>
      (!searchKeyword.value ||
        item.label.toLocaleLowerCase().includes(searchKeyword.value.toLocaleLowerCase())) &&
      (activeFilter.value === 'all' || activeFilter.value === 'folders')
  )
);
const windowTitle = computed(() => {
  if (isRootView.value) return i18n('computer');
  if (router_url.value.startsWith('search:')) return i18n('computer.search.results');
  return (
    standardFolders.value.find((item) => item.path === router_url.value)?.label ||
    router_url.value.split('/').filter(Boolean).pop() ||
    i18n('computer')
  );
});
async function selectShortcut(item: StandardFolder) {
  const file = await system.fs.stat(item.path);
  if (file) onFileSelect(file);
}
function openSelected() {
  if (selectedFile.value) openFolder(selectedFile.value);
}
function showSelectedProperties() {
  const file = selectedFile.value;
  if (!file) return;
  if (file.path.split('/').filter(Boolean).length === 1) openVolumeProps(file);
  else openPropsWindow(system, file.path);
}
function getDriveIcon(file: VtronFileWithoutContent) {
  return file.path === '/C'
    ? systemDriveIcon
    : getVolumeLetter(file).length === 1
      ? localDriveIcon
      : networkDriveIcon;
}
function driveName(file: VtronFileWithoutContent) {
  const name = getVolumeLetter(file);
  return name.length === 1 ? `${i18n('local.disk')} (${name}:)` : name;
}
function showRootMenu(event: MouseEvent) {
  system.buildFromTemplate([{ label: i18n('refresh'), click: onListRefresh }]).popup(event);
}
function goUp() {
  if (router_url.value.startsWith('search:')) handleHistoryChange(-1);
  else backFolder();
}
function onWindowKey(event: KeyboardEvent) {
  if ((event.target as HTMLElement).closest('input, textarea')) return;
  if (event.key === 'F5') {
    event.preventDefault();
    onListRefresh();
  }
  if (event.altKey && event.key === 'ArrowLeft') {
    event.preventDefault();
    handleHistoryChange(-1);
  }
  if (event.altKey && event.key === 'ArrowRight') {
    event.preventDefault();
    handleHistoryChange(1);
  }
  if (event.altKey && event.key === 'ArrowUp') {
    event.preventDefault();
    goUp();
  }
}

const EXT_MAP: Record<string, string[]> = {
  documents: [
    '.txt',
    '.doc',
    '.docx',
    '.pdf',
    '.json',
    '.md',
    '.csv',
    '.xml',
    '.html',
    '.htm',
    '.rtf',
    '.log',
    '.ini',
    '.cfg',
    '.yaml',
    '.yml',
    '.toml',
  ],
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
  selectedFile.value = null;
  previewInfo.value = null;
  ++previewVersion;
  activeFilter.value = key;
}
function handleSearchInput(keyword: string) {
  selectedFile.value = null;
  previewInfo.value = null;
  ++previewVersion;
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

let previewVersion = 0;
async function loadPreview(file: VtronFileWithoutContent) {
  const version = ++previewVersion;
  const stat = await system.fs.stat(file.path);
  if (version !== previewVersion) return;
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

  if (version === previewVersion) previewInfo.value = info;
}

const isRootView = computed(() => {
  const url = router_url.value;
  return !url || (!url.startsWith('search:') && normalize(url.replaceAll('\\', '/')) === '/');
});
const canCreateHere = computed(() => !isRootView.value && !router_url.value.startsWith('search:'));

function getVolumeLetter(file: VtronFileWithoutContent): string {
  return file.path.split('/').filter(Boolean)[0] || '';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

const setRouter = function (path: string) {
  searchKeyword.value = '';
  selectedFile.value = null;
  previewInfo.value = null;
  ++previewVersion;
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
    ++previewVersion;
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
  searchKeyword.value = '';
  selectedFile.value = null;
  previewInfo.value = null;
  ++previewVersion;
  if (router_url_history_index.value + offset < 0) return;
  if (router_url_history_index.value + offset > router_url_history.value.length - 1) return;
  router_url_history_index.value = router_url_history_index.value + offset;
  router_url.value = router_url_history.value[router_url_history_index.value];

  refersh();
}
const leftWidth = ref(156);
let stopSidebarResize: (() => void) | undefined;
function leftHandleDown(e: MouseEvent) {
  stopSidebarResize?.();
  const startX = e.clientX;
  const startWidth = leftWidth.value;
  addEventListener('mousemove', leftHandleMove);
  addEventListener('mouseup', leftHandleUp);
  stopSidebarResize = leftHandleUp;
  function leftHandleMove(e: MouseEvent) {
    const moveX = e.clientX - startX;
    if (startWidth + moveX < 100) return;
    if (startWidth + moveX > 500) return;
    leftWidth.value = startWidth + moveX;
  }
  function leftHandleUp() {
    removeEventListener('mousemove', leftHandleMove);
    removeEventListener('mouseup', leftHandleUp);
    stopSidebarResize = undefined;
  }
}

const rootFileList = ref<Array<VtronFileWithoutContent>>([]);
function refreshAfterProps() {
  void refersh();
}
onMounted(() => {
  setRouter(config?.path || '/');
  void onComputerMount();
  system.mountEvent('file.props.edit', refreshAfterProps);
  void refreshNavigation();
});
onUnmounted(() => {
  system.offEvent('file.props.edit', refreshAfterProps);
  removeEventListener('mousemove', backgroundMove);
  removeEventListener('mouseup', backgroundUp);
  stopSidebarResize?.();
  ++previewVersion;
});
async function refreshNavigation() {
  rootFileList.value = await system.fs.readdir('/');
  for (const item of standardFolders.value) item.available = await system.fs.exists(item.path);
  notesAvailable.value = await system.fs.exists(userPath + 'Note');
}

function handleOuterClick() {
  system.emitEvent('mycomputer.click');
}

function onListRefresh() {
  void refersh();
  void refreshNavigation();
}

/**------视图切换------ */
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
function backgroundUp(e: MouseEvent) {
  chosing(e);
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
const newFolderInput = ref<HTMLInputElement>();
async function startCreatingFolder() {
  if (!canCreateHere.value) return;
  creating.value = true;
  await nextTick();
  newFolderInput.value?.focus();
  newFolderInput.value?.select();
}
function creatingEditEnd() {
  if (creating.value) {
    const name = createInput.value.trim();
    if (canCreateHere.value && name && name !== '.' && name !== '..' && !/[\\/:*?"<>|]/.test(name))
      createFolder(name);
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
  if (!canCreateHere.value) {
    showRootMenu(e);
    return;
  }
  createDesktopContextMenu(system, e, router_url.value, () => {
    refersh();
  });
}
/* ------------ 路径输入框 ------------*/
async function handleNavRefresh(path: string) {
  if (!path) return;
  if (path.startsWith('search:')) {
    setRouter(path);
    await refersh();
    return;
  }
  const target = await system.fs.stat(path);
  if (target?.isDirectory) {
    setRouter(path);
    await refersh();
  } else if (target) system.openFile(path);
  else system.createNotify({ title: i18n('tips'), content: i18n('path.not.exist') });
}

async function handleNavSearch(path: string) {
  if (!path.trim()) return;
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
watch(windowTitle, (title) => browserWindow?.setTitle(title));
</script>
<style scoped>
.computer-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #000;
  background: #fff;
  font:
    12px/1.35 'Segoe UI',
    'Microsoft YaHei UI',
    'Microsoft YaHei',
    sans-serif;
  outline: 1px solid #a6a6a6;
  outline-offset: -1px;
  user-select: none;
}
.computer-container *,
.computer-container *::before,
.computer-container *::after {
  box-sizing: border-box;
}
button,
input {
  font: inherit;
  color: inherit;
}
button {
  padding: 0;
  border: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  cursor: default;
}
button:disabled {
  color: #929292;
}
button:disabled img {
  opacity: 0.45;
}
button:hover:enabled {
  border-color: #a4cef9;
  background: #e5f3ff;
}
button:focus-visible {
  outline: 1px dotted #555;
  outline-offset: -3px;
}
.mdl {
  flex-shrink: 0;
  font-family: 'SEGOEUIMDL';
  font-size: 16px;
  font-style: normal;
  font-weight: normal;
  line-height: 1;
}
.main {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.left-tree {
  position: relative;
  flex-shrink: 0;
  min-width: 100px;
  height: 100%;
  overflow: hidden auto;
  border-right: 1px solid #e5e5e5;
  padding: 8px 0;
}
.nav-heading,
.nav-item,
.nav-main {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  width: 100%;
  padding: 0 6px;
  text-align: left;
  white-space: nowrap;
}
.nav-heading img,
.nav-item img,
.nav-main img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}
.nav-item > span:not(.mdl):not(.tree-indent),
.nav-main > span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.tree-chevron {
  width: 10px;
  font-size: 8px;
  color: #777;
}
.tree-indent {
  width: 10px;
  flex-shrink: 0;
}
.nav-item.quick-child {
  padding-left: 30px;
  gap: 7px;
}
.nav-item.computer-child {
  padding-left: 12px;
  gap: 5px;
}
.pin {
  font-size: 10px;
  color: #999;
  margin-left: auto;
  margin-right: 6px;
}
.section-start {
  margin-top: 12px;
}
.nav-computer {
  display: flex;
  align-items: center;
  height: 24px;
  margin-top: 8px;
}
.nav-computer.current,
.nav-item.current {
  background: #cce8ff;
}
.tree-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}
.nav-main {
  padding-left: 4px;
  min-width: 0;
}
.left-handle {
  position: absolute;
  z-index: 2;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: ew-resize;
}
.desk-outer {
  position: relative;
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: flex-start;
  align-content: flex-start;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: auto;
}
.desk-outer.root-view {
  display: block;
}
.volume-view {
  min-width: 285px;
  padding: 0 8px 16px 10px;
}
.section-heading {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  height: 30px;
  border: 0;
  color: #1f4e79;
  font-size: 15px;
  text-align: left;
  white-space: nowrap;
}
.section-heading .mdl {
  font-size: 10px;
  color: #666;
}
.section-heading:hover:enabled {
  background: transparent;
}
.section-line {
  height: 1px;
  background: #ddd;
  flex: 1;
  margin-left: 3px;
}
.folder-grid,
.volume-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 254px);
  grid-auto-rows: 60px;
  padding-left: 40px;
}
.folder-card,
.volume-card {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  width: 254px;
  height: 60px;
  padding: 5px 6px;
  text-align: left;
}
.folder-card img,
.volume-card > img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  flex-shrink: 0;
}
.folder-card > span {
  align-self: flex-start;
  padding-top: 7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.folder-card.selected,
.volume-card.selected {
  border-color: #99d1ff;
  background: #cce8ff;
}
.volume-card {
  width: 222px;
  height: 70px;
}
.volume-grid {
  grid-auto-rows: 70px;
}
.volume-card-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.volume-card-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.volume-card-bar {
  display: block;
  width: 100%;
  height: 13px;
  border: 1px solid #bcbcbc;
  background: #e6e6e6;
}
.volume-card-space {
  color: #777;
  font-size: 11px;
}
.compact-view .folder-grid,
.compact-view .volume-grid {
  grid-template-columns: minmax(250px, 1fr);
  padding-left: 16px;
  grid-auto-rows: 30px;
}
.compact-view .folder-card,
.compact-view .volume-card {
  width: 100%;
  height: 30px;
}
.compact-view .folder-card img,
.compact-view .volume-card > img {
  width: 20px;
  height: 20px;
}
.compact-view .folder-card > span {
  padding-top: 0;
  align-self: center;
}
.compact-view .volume-card-info {
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 20px;
}
.compact-view .volume-card-bar {
  display: none;
}
.empty-message {
  width: 100%;
  margin: 18px 0;
  text-align: center;
  color: #666;
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 4px 12px;
  border-bottom: 1px solid #ddd;
  background: #f5f6f7;
}
.filter-bar button {
  padding: 2px 8px;
}
.filter-bar button.active {
  border-color: #99d1ff;
  background: #cce8ff;
}
.new-folder-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90px;
  min-height: 90px;
  margin: 6px;
  padding-top: 4px;
}
.new-folder-item img {
  width: 48px;
  height: 48px;
}
.item_input {
  width: 90px;
  margin-top: 3px;
  padding: 1px 3px;
  border: 1px solid #0078d7;
  outline: 0;
}
.status-bar {
  display: flex;
  align-items: center;
  gap: 18px;
  height: 23px;
  flex-shrink: 0;
  padding-left: 12px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  color: #555;
}
.status-spacer {
  flex: 1;
}
.status-bar button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 22px;
}
.status-bar button.checked {
  border-color: #99d1ff;
  background: #cce8ff;
}
.status-bar .mdl {
  font-size: 16px;
}
.preview-panel {
  flex-shrink: 0;
  width: 220px;
  height: 100%;
  border-left: 1px solid #ddd;
  overflow: auto;
  background: #fff;
}
.preview-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border-bottom: 1px solid #eee;
}
.preview-thumbnail {
  max-width: 180px;
  max-height: 140px;
  object-fit: contain;
}
.preview-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
}
.preview-name {
  text-align: center;
  overflow-wrap: anywhere;
}
.preview-details {
  padding: 10px 12px;
}
.preview-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}
.preview-label {
  color: #777;
}
.preview-value {
  overflow-wrap: anywhere;
}
.preview-text {
  padding: 8px 12px;
  border-top: 1px solid #eee;
}
.preview-text pre {
  margin: 0;
  max-height: 220px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  overflow: auto;
  font:
    11px/1.4 Consolas,
    Monaco,
    monospace;
}
.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #777;
}
.desk-outer::-webkit-scrollbar,
.left-tree::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}
.desk-outer::-webkit-scrollbar-track,
.left-tree::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.desk-outer::-webkit-scrollbar-thumb,
.left-tree::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border: 2px solid #f1f1f1;
}
.desk-outer :deep(.file-item) {
  color: #000;
  font: inherit;
  border-radius: 0;
}
.desk-outer :deep(.file-item:hover) {
  background: #e5f3ff;
  border-color: #e5f3ff;
}
.desk-outer :deep(.file-item.chosen) {
  background: #cce8ff;
  border-color: #99d1ff;
}
.desk-outer :deep(.mode-detail) {
  height: 25px;
  margin: 0;
  padding: 0 7px;
}
.desk-outer :deep(.mode-detail .file-item_img) {
  width: 20px;
  height: 18px;
  margin: 0 5px 0 0;
}
.desk-outer :deep(.file-bar) {
  height: 26px;
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fff;
  border-bottom: 1px solid #eee;
}
@media (max-width: 600px) {
  .folder-grid,
  .volume-grid {
    padding-left: 12px;
  }
  .preview-panel {
    width: 190px;
  }
}
.desk-outer.details-view {
  padding-left: 14px;
}
.desk-outer :deep(.native-detail) {
  min-width: 650px;
  flex-shrink: 0;
}
.desk-outer :deep(.native-detail .file-item_title) {
  flex: 1;
  min-width: 200px;
  width: auto;
}
.desk-outer :deep(.native-detail .file-item_type) {
  flex-shrink: 0;
  color: #666;
}
.desk-outer :deep(.native-detail .detail-modified) {
  width: 160px;
}
.desk-outer :deep(.native-detail .detail-kind) {
  width: 140px;
}
.desk-outer :deep(.native-detail .detail-size) {
  width: 90px;
  text-align: right;
  padding-right: 10px;
}
.desk-outer :deep(.file-bar.native-detail > div) {
  height: 25px;
  padding: 4px 7px;
  border-right: 1px solid #e5e5e5;
}
</style>
<style>
.wintmp_outer.max:has(> .wintmp_main > .computer-container) > .win_drag_border,
.wintmp_outer.fullscreen:has(> .wintmp_main > .computer-container) > .win_drag_border {
  display: none;
}
.wintmp_outer.max:has(> .wintmp_main > .computer-container),
.wintmp_outer.fullscreen:has(> .wintmp_main > .computer-container) {
  border-radius: 0 !important;
  box-shadow: none !important;
}
</style>
