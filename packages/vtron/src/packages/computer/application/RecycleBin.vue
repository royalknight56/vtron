<template>
  <div class="recycle-window" @keydown="onKeydown" @mousedown.capture="dismissMenu">
    <header
      v-dragable
      class="explorer-titlebar"
      @mousedown.capture="win?.moveTop()"
      @touchstart.capture.passive="win?.moveTop()"
      @mousedown.stop
      @touchstart.stop.passive
      @dblclick="toggleMaximize"
    >
      <div class="quick-toolbar" @mousedown.stop @touchstart.stop.passive @dblclick.stop>
        <img :src="recycleIcon" alt="" class="window-icon" />
        <span class="quick-divider"></span>
        <button disabled :title="t('props')" :aria-label="t('props')">
          <img :src="propertiesSmallIcon" alt="" />
        </button>
        <button disabled :title="t('new.folder')" :aria-label="t('new.folder')">
          <img :src="folderIcon" alt="" />
        </button>
        <button disabled aria-label="Customize Quick Access Toolbar">
          <span class="mdl tiny" aria-hidden="true">&#xE70D;</span>
        </button>
      </div>
      <span class="context-heading">{{ t('recycle.bin.tools') }}</span>
      <span class="window-title">{{ t('recycle.bin') }}</span>
      <div class="window-controls" @mousedown.stop @touchstart.stop.passive @dblclick.stop>
        <button :aria-label="t('minimize')" :title="t('minimize')" @click="win?.minimize()">
          <span class="mdl" aria-hidden="true">&#xE921;</span>
        </button>
        <button
          :aria-label="maximized ? t('recycle.bin.restore') : t('maximize')"
          :title="maximized ? t('recycle.bin.restore') : t('maximize')"
          @click="toggleMaximize"
        >
          <span class="mdl" aria-hidden="true">{{ maximized ? '\uE923' : '\uE922' }}</span>
        </button>
        <button class="window-close" :aria-label="t('close')" :title="t('close')" @click="win?.close()">
          <span class="mdl" aria-hidden="true">&#xE8BB;</span>
        </button>
      </div>
    </header>

    <nav class="ribbon-tabs" aria-label="Ribbon">
      <button class="file-tab" disabled>{{ t('file') }}</button>
      <button
        :class="{ active: ribbonTab === 'home' }"
        :aria-pressed="ribbonTab === 'home'"
        @click="showTab('home')"
      >
        {{ t('recycle.bin.home') }}
      </button>
      <button disabled>{{ t('recycle.bin.share') }}</button>
      <button
        :class="{ active: ribbonTab === 'view' }"
        :aria-pressed="ribbonTab === 'view'"
        @click="showTab('view')"
      >
        {{ t('recycle.bin.view') }}
      </button>
      <button
        class="manage-tab"
        :class="{ active: ribbonTab === 'manage' }"
        :aria-pressed="ribbonTab === 'manage'"
        @click="showTab('manage')"
      >
        {{ t('recycle.bin.manage') }}
      </button>
      <div class="tab-spacer"></div>
      <button
        class="ribbon-toggle"
        :aria-label="collapsed ? t('recycle.bin.expand.ribbon') : t('recycle.bin.collapse.ribbon')"
        :title="collapsed ? t('recycle.bin.expand.ribbon') : t('recycle.bin.collapse.ribbon')"
        @click="collapsed = !collapsed"
      >
        <span class="mdl" aria-hidden="true">{{ collapsed ? '\uE70D' : '\uE70E' }}</span>
      </button>
      <button class="help-button" disabled aria-label="Help">
        <span class="mdl" aria-hidden="true">&#xE897;</span>
      </button>
    </nav>

    <div v-if="!collapsed" class="ribbon" :class="{ 'manage-ribbon': ribbonTab === 'manage' }">
      <template v-if="ribbonTab === 'manage'">
        <section class="ribbon-group">
          <div class="ribbon-commands">
            <button class="large-command" :disabled="busy || !list.length" @click="handleEmptyAll">
              <img :src="emptyBinIcon" alt="" /><span>{{ ribbonLabel(t('recycle.bin.empty.all')) }}</span>
            </button>
            <button class="large-command" disabled>
              <img :src="propertiesIcon" alt="" /><span>{{ ribbonLabel(t('recycle.bin.properties')) }}</span>
            </button>
          </div>
          <div class="group-label">{{ t('recycle.bin.manage') }}</div>
        </section>
        <section class="ribbon-group">
          <div class="ribbon-commands">
            <button class="large-command" :disabled="busy || !list.length" @click="handleRestore(list)">
              <img :src="restoreAllIcon" alt="" /><span>{{ ribbonLabel(t('recycle.bin.restore.all')) }}</span>
            </button>
            <button
              class="large-command selected-restore"
              :disabled="busy || !selectedItems.length"
              @click="handleRestore(selectedItems)"
            >
              <img :src="restoreSelectedIcon" alt="" /><span>{{
                ribbonLabel(t('recycle.bin.restore.selected'))
              }}</span>
            </button>
          </div>
          <div class="group-label">{{ t('recycle.bin.restore') }}</div>
        </section>
      </template>
      <template v-else-if="ribbonTab === 'home'">
        <section class="ribbon-group">
          <div class="ribbon-commands">
            <button class="large-command" disabled>
              <span class="mdl ribbon-icon" aria-hidden="true">&#xE77F;</span><span>{{ t('paste') }}</span>
            </button>
            <button class="large-command" disabled>
              <span class="mdl ribbon-icon" aria-hidden="true">&#xE8C8;</span><span>{{ t('copy') }}</span>
            </button>
            <button
              class="large-command"
              :disabled="busy || !selectedItems.length"
              @click="handleDeleteSelected"
            >
              <span class="mdl ribbon-icon delete-icon" aria-hidden="true">&#xE74D;</span
              ><span>{{ t('delete') }}</span>
            </button>
            <button class="large-command" disabled>
              <span class="mdl ribbon-icon" aria-hidden="true">&#xE8AC;</span><span>{{ t('rename') }}</span>
            </button>
          </div>
        </section>
        <section class="ribbon-group selection-commands">
          <button :disabled="!visibleItems.length || busy" @click="selectAll">
            <span class="mdl" aria-hidden="true">&#xE8B3;</span>{{ t('recycle.bin.select.all') }}
          </button>
          <button :disabled="!selectedItems.length || busy" @click="selection = []">
            <span class="mdl" aria-hidden="true">&#xE894;</span>{{ t('recycle.bin.clear.selection') }}
          </button>
          <button :disabled="!visibleItems.length || busy" @click="invertSelection">
            <span class="mdl" aria-hidden="true">&#xE8B4;</span>{{ t('recycle.bin.invert.selection') }}
          </button>
          <div class="group-label">{{ t('recycle.bin.selection') }}</div>
        </section>
      </template>
      <template v-else>
        <section class="ribbon-group">
          <div class="ribbon-commands">
            <button class="large-command" disabled>
              <span class="mdl ribbon-icon" aria-hidden="true">&#xE8A0;</span
              ><span>{{ t('recycle.bin.navigation.pane') }}</span>
            </button>
            <button class="large-command" disabled>
              <span class="mdl ribbon-icon" aria-hidden="true">&#xE8A1;</span
              ><span>{{ t('recycle.bin.preview.pane') }}</span>
            </button>
          </div>
          <div class="group-label">{{ t('recycle.bin.panes') }}</div>
        </section>
        <section class="ribbon-group">
          <div class="ribbon-commands">
            <button
              class="large-command"
              :class="{ checked: viewMode === 'icons' }"
              :aria-pressed="viewMode === 'icons'"
              @click="viewMode = 'icons'"
            >
              <span class="mdl ribbon-icon" aria-hidden="true">&#xE8A9;</span
              ><span>{{ t('recycle.bin.large.icons') }}</span>
            </button>
            <button
              class="large-command"
              :class="{ checked: viewMode === 'details' }"
              :aria-pressed="viewMode === 'details'"
              @click="viewMode = 'details'"
            >
              <span class="mdl ribbon-icon" aria-hidden="true">&#xE8FD;</span
              ><span>{{ t('recycle.bin.details') }}</span>
            </button>
          </div>
          <div class="group-label">{{ t('recycle.bin.layout') }}</div>
        </section>
        <section class="ribbon-group">
          <div class="ribbon-commands">
            <button class="large-command" disabled>
              <span class="mdl ribbon-icon" aria-hidden="true">&#xE713;</span
              ><span>{{ t('recycle.bin.options') }}</span>
            </button>
          </div>
        </section>
      </template>
    </div>

    <div class="address-toolbar">
      <div class="history-buttons">
        <button disabled :aria-label="t('back')"><span class="mdl" aria-hidden="true">&#xE72B;</span></button>
        <button disabled aria-label="Forward"><span class="mdl" aria-hidden="true">&#xE72A;</span></button>
        <button disabled aria-label="Recent locations">
          <span class="mdl tiny" aria-hidden="true">&#xE70D;</span>
        </button>
        <button
          :title="t('recycle.bin.this.pc')"
          :aria-label="t('recycle.bin.this.pc')"
          @click="navigate('/')"
        >
          <span class="mdl" aria-hidden="true">&#xE74A;</span>
        </button>
      </div>
      <div class="address-box">
        <img :src="recycleIcon" alt="" /><span class="mdl tiny" aria-hidden="true">&#xE76C;</span
        ><span>{{ t('recycle.bin') }}</span
        ><button disabled aria-label="Address locations">
          <span class="mdl tiny" aria-hidden="true">&#xE70D;</span></button
        ><button :disabled="busy" :aria-label="t('refresh')" :title="t('refresh')" @click="refresh">
          <span class="mdl" aria-hidden="true">&#xE72C;</span>
        </button>
      </div>
      <div class="search-box">
        <input
          v-model="query"
          type="search"
          :placeholder="t('recycle.bin.search')"
          :aria-label="t('recycle.bin.search')"
          @keydown.esc="query = ''"
        /><span class="mdl" aria-hidden="true">&#xE721;</span>
      </div>
    </div>

    <div class="explorer-body">
      <aside class="navigation-pane" :aria-label="t('recycle.bin.navigation.pane')">
        <div class="nav-heading">
          <span class="mdl tree-chevron" aria-hidden="true">&#xE70D;</span
          ><img :src="quickAccessIcon" alt="" class="nav-icon" />{{ t('recycle.bin.quick.access') }}
        </div>
        <button
          v-for="item in quickLinks"
          :key="item.label"
          class="nav-item child"
          :disabled="!item.available"
          @click="navigate(item.path)"
        >
          <img :src="item.icon" alt="" /><span>{{ t(item.label) }}</span
          ><span v-if="item.pinned" class="mdl pin" aria-hidden="true">&#xE718;</span>
        </button>
        <button class="nav-item section-start" disabled>
          <span class="tree-indent"></span><img :src="oneDriveIcon" alt="" /><span>OneDrive</span>
        </button>
        <button class="nav-item section-start" @click="navigate('/')">
          <span class="mdl tree-chevron" aria-hidden="true">&#xE76C;</span
          ><img :src="computerIcon" alt="" /><span>{{ t('recycle.bin.this.pc') }}</span>
        </button>
        <button class="nav-item section-start" disabled>
          <span class="mdl tree-chevron" aria-hidden="true">&#xE76C;</span
          ><img :src="networkIcon" alt="" /><span>{{ t('recycle.bin.network') }}</span>
        </button>
        <button class="nav-item current section-start" aria-current="page" @click="query = ''">
          <span class="tree-indent"></span><img :src="recycleIcon" alt="" /><span>{{
            t('recycle.bin')
          }}</span>
        </button>
      </aside>
      <div
        class="files-pane"
        :aria-busy="busy"
        @click.self="selection = []"
        @contextmenu.self.prevent="showBackgroundMenu"
      >
        <div
          ref="itemsRef"
          class="file-scroll"
          @click.self="selection = []"
          @contextmenu.self.prevent="showBackgroundMenu"
        >
          <table v-if="viewMode === 'details'" class="file-table" :aria-label="t('recycle.bin')">
            <colgroup>
              <col v-for="column in columns" :key="column.key" :style="{ width: column.width + 'px' }" />
            </colgroup>
            <thead>
              <tr>
                <th
                  v-for="column in columns"
                  :key="column.key"
                  :aria-sort="sortKey === column.key ? (sortAsc ? 'ascending' : 'descending') : 'none'"
                >
                  <button @click="toggleSort(column.key)">
                    {{ t(column.label)
                    }}<span v-if="sortKey === column.key" class="mdl sort-mark" aria-hidden="true">{{
                      sortAsc ? '\uE70E' : '\uE70D'
                    }}</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in visibleItems"
                :key="item.storedName"
                :class="{ chosen: selection.includes(item.storedName) }"
                :tabindex="
                  focusedItem === item.storedName ||
                  (!focusedItem && item.storedName === visibleItems[0]?.storedName)
                    ? 0
                    : -1
                "
                :aria-selected="selection.includes(item.storedName)"
                :aria-label="item.originalName"
                :data-item="item.storedName"
                @click.stop="choose($event, item)"
                @keydown="onItemKey($event, item)"
                @contextmenu.prevent.stop="showItemMenu($event, item)"
              >
                <td>
                  <div class="file-name">
                    <img :src="item.icon" alt="" /><span>{{ item.originalName }}</span>
                  </div>
                </td>
                <td :title="displayPath(dirname(item.originalPath))">
                  {{ displayPath(dirname(item.originalPath)) }}
                </td>
                <td>{{ formatTime(item.deletedAt) }}</td>
                <td class="size-cell">{{ formatSize(item) }}</td>
                <td>{{ fileType(item) }}</td>
                <td>{{ item.modifiedAt ? formatTime(item.modifiedAt) : '' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="icon-grid" :aria-label="t('recycle.bin')">
            <button
              v-for="item in visibleItems"
              :key="item.storedName"
              class="file-tile"
              :class="{ chosen: selection.includes(item.storedName) }"
              :data-item="item.storedName"
              :aria-pressed="selection.includes(item.storedName)"
              @click.stop="choose($event, item)"
              @contextmenu.prevent.stop="showItemMenu($event, item)"
            >
              <img :src="item.icon" alt="" /><span>{{ item.originalName }}</span>
            </button>
          </div>
          <p v-if="!visibleItems.length" class="empty-message">
            {{ query.trim() ? t('recycle.bin.no.results') : t('recycle.bin.empty') }}
          </p>
        </div>
        <div v-if="error" class="operation-error" role="alert">{{ error }}</div>
      </div>
    </div>
    <Teleport to="body">
      <div
        v-if="contextMenu"
        class="recycle-menu"
        role="menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
      >
        <template v-if="contextMenu.item">
          <button
            role="menuitem"
            :disabled="busy"
            @click="
              contextMenu = null;
              handleRestore(selectedItems);
            "
          >
            {{ t('recycle.bin.restore') }}
          </button>
          <button
            role="menuitem"
            :disabled="busy"
            @click="
              contextMenu = null;
              handleDeleteSelected();
            "
          >
            {{ t('delete') }}
          </button>
          <div class="menu-separator"></div>
          <button role="menuitem" disabled>{{ t('props') }}</button>
        </template>
        <template v-else>
          <button
            role="menuitem"
            :disabled="busy"
            @click="
              contextMenu = null;
              refresh();
            "
          >
            {{ t('refresh') }}
          </button>
          <button
            role="menuitem"
            :disabled="busy || !visibleItems.length"
            @click="
              contextMenu = null;
              selectAll();
            "
          >
            {{ t('recycle.bin.select.all') }}
          </button>
          <div class="menu-separator"></div>
          <button
            role="menuitem"
            :disabled="busy || !list.length"
            @click="
              contextMenu = null;
              handleEmptyAll();
            "
          >
            {{ t('recycle.bin.empty.all') }}
          </button>
        </template>
      </div>
    </Teleport>
    <footer class="explorer-status" aria-live="polite">
      <span>{{ t('recycle.bin.items').replace('{count}', String(visibleItems.length)) }}</span
      ><span v-if="selectedItems.length">{{
        t('recycle.bin.selected.items').replace('{count}', String(selectedItems.length))
      }}</span
      ><span v-if="busy">{{ t('recycle.bin.loading') }}</span>
      <div class="status-spacer"></div>
      <button
        :class="{ checked: viewMode === 'details' }"
        :aria-label="t('recycle.bin.details')"
        :title="t('recycle.bin.details')"
        :aria-pressed="viewMode === 'details'"
        @click="viewMode = 'details'"
      >
        <span class="mdl" aria-hidden="true">&#xE8FD;</span></button
      ><button
        :class="{ checked: viewMode === 'icons' }"
        :aria-label="t('recycle.bin.large.icons')"
        :title="t('recycle.bin.large.icons')"
        :aria-pressed="viewMode === 'icons'"
        @click="viewMode = 'icons'"
      >
        <span class="mdl" aria-hidden="true">&#xE8A9;</span>
      </button>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import { System, dirname, extname } from '@/packages/kernel';
import { BrowserWindow, Dialog } from '@/packages/services';
import { i18n as t } from '@/packages/computer/i18n';
import { vDragable } from '@/packages/computer/layout/windowGroup/MakeDragable';
import {
  readRecycleMeta,
  restoreFromRecycleBin,
  permanentDelete,
  type RecycleMeta,
} from './components/fileOpt';
import recycleIcon from '@packages/assets/vtron-recyle-bin.png';
import folderIcon from '@packages/assets/folder.png';
import computerIcon from '@packages/assets/recycle-bin/this-pc.png';
import unknownIcon from '@packages/assets/unknown.png';
import propertiesIcon from '@packages/assets/recycle-bin/properties.png';
import propertiesSmallIcon from '@packages/assets/recycle-bin/properties-small.png';
import emptyBinIcon from '@packages/assets/recycle-bin/empty-bin.png';
import restoreAllIcon from '@packages/assets/recycle-bin/restore-all.png';
import restoreSelectedIcon from '@packages/assets/recycle-bin/restore-selected.png';
import desktopIcon from '@packages/assets/recycle-bin/desktop.png';
import downloadsIcon from '@packages/assets/recycle-bin/downloads.png';
import documentsIcon from '@packages/assets/recycle-bin/documents.png';
import picturesIcon from '@packages/assets/recycle-bin/pictures.png';
import musicIcon from '@packages/assets/recycle-bin/music.png';
import videosIcon from '@packages/assets/recycle-bin/videos.png';
import oneDriveIcon from '@packages/assets/recycle-bin/onedrive.png';
import networkIcon from '@packages/assets/recycle-bin/network.png';
import quickAccessIcon from '@packages/assets/recycle-bin/quick-access.png';

const system = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');
const maximized = computed(() => win?.isMaximized() ?? false);
const ribbonTab = ref<'manage' | 'home' | 'view'>('manage');
const collapsed = ref(false);
const viewMode = ref<'details' | 'icons'>('details');
const query = ref('');
const busy = ref(false);
const error = ref('');
const contextMenu = ref<{ x: number; y: number; item: boolean } | null>(null);
interface RecycleItem extends RecycleMeta {
  size?: number;
  modifiedAt?: number;
  icon: string;
}
const list = ref<RecycleItem[]>([]);
const selection = ref<string[]>([]);
const focusedItem = ref('');
const itemsRef = ref<HTMLElement>();
type SortKey = 'name' | 'location' | 'deleted' | 'size' | 'type' | 'modified';
const sortKey = ref<SortKey>('name');
const sortAsc = ref(true);
const columns: { key: SortKey; label: Parameters<typeof t>[0]; width: number }[] = [
  { key: 'name', label: 'recycle.bin.name', width: 470 },
  { key: 'location', label: 'recycle.bin.original.path', width: 240 },
  { key: 'deleted', label: 'recycle.bin.deleted.at', width: 160 },
  { key: 'size', label: 'recycle.bin.size', width: 80 },
  { key: 'type', label: 'recycle.bin.type', width: 120 },
  { key: 'modified', label: 'recycle.bin.modified.at', width: 154 },
];
const visibleItems = computed(() => {
  const search = query.value.trim().toLocaleLowerCase();
  return list.value
    .filter((item) => !search || item.originalName.toLocaleLowerCase().includes(search))
    .sort((a, b) => {
      let diff = 0;
      if (sortKey.value === 'name') diff = a.originalName.localeCompare(b.originalName);
      if (sortKey.value === 'location') diff = dirname(a.originalPath).localeCompare(dirname(b.originalPath));
      if (sortKey.value === 'deleted') diff = a.deletedAt - b.deletedAt;
      if (sortKey.value === 'size') diff = (a.size ?? 0) - (b.size ?? 0);
      if (sortKey.value === 'type') diff = fileType(a).localeCompare(fileType(b));
      if (sortKey.value === 'modified') diff = (a.modifiedAt ?? 0) - (b.modifiedAt ?? 0);
      return (diff || a.storedName.localeCompare(b.storedName)) * (sortAsc.value ? 1 : -1);
    });
});
watch(visibleItems, (items) => {
  const names = new Set(items.map((item) => item.storedName));
  selection.value = selection.value.filter((name) => names.has(name));
  if (!names.has(focusedItem.value)) focusedItem.value = '';
});
const selectedItems = computed(() =>
  visibleItems.value.filter((item) => selection.value.includes(item.storedName))
);
const userPath = system._options.userLocation || '/C/Users/';
const quickLinks = ref<
  {
    label: Parameters<typeof t>[0];
    icon: string;
    path: string;
    available: boolean;
    pinned: boolean;
  }[]
>([
  {
    label: 'recycle.bin.desktop',
    icon: desktopIcon,
    path: userPath + 'Desktop',
    available: false,
    pinned: true,
  },
  {
    label: 'recycle.bin.downloads',
    icon: downloadsIcon,
    path: userPath + 'Downloads',
    available: false,
    pinned: true,
  },
  {
    label: 'recycle.bin.documents',
    icon: documentsIcon,
    path: userPath + 'Documents',
    available: false,
    pinned: true,
  },
  {
    label: 'recycle.bin.pictures',
    icon: picturesIcon,
    path: userPath + 'Photo',
    available: false,
    pinned: true,
  },
  {
    label: 'recycle.bin.music',
    icon: musicIcon,
    path: userPath + 'Music',
    available: false,
    pinned: false,
  },
  {
    label: 'recycle.bin.videos',
    icon: videosIcon,
    path: userPath + 'Videos',
    available: false,
    pinned: false,
  },
]);
let refreshVersion = 0;
let lastRefresh = 0;
async function refresh() {
  if (busy.value) return;
  const version = ++refreshVersion;
  try {
    const meta = await readRecycleMeta(system);
    const rows = await Promise.all(
      meta.map(async (item) => {
        const info = await system.fs.stat(`${userPath}RecycleBin/${item.storedName}`);
        return {
          ...item,
          size: info?.size,
          modifiedAt: info ? new Date(info.mtime).getTime() : undefined,
          icon: item.isDirectory
            ? folderIcon
            : system.getOpener(extname(item.originalName))?.icon || unknownIcon,
        };
      })
    );
    if (version !== refreshVersion) return;
    list.value = rows;
    selection.value = selection.value.filter((name) => rows.some((item) => item.storedName === name));
    if (!rows.some((item) => item.storedName === focusedItem.value)) focusedItem.value = '';
    lastRefresh = performance.now();
  } catch {
    error.value = t('recycle.bin.error');
  }
}
function refreshOnFocus() {
  if (performance.now() - lastRefresh > 1000) void refresh();
}
function ribbonLabel(text: string) {
  const labels: Record<string, string> = {
    清空回收站: '清空\n回收站',
    回收站属性: '回收站\n属性',
    还原所有项目: '还原所有\n项目',
    还原选定的项目: '还原选定的\n项目',
  };
  return labels[text] ?? text;
}
function showTab(tab: typeof ribbonTab.value) {
  ribbonTab.value = tab;
  collapsed.value = false;
}
function toggleMaximize() {
  if (maximized.value) win?.unmaximize();
  else win?.maximize();
}
function toggleSort(key: SortKey) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value;
  else {
    sortKey.value = key;
    sortAsc.value = true;
  }
}
function displayPath(path: string) {
  return path.replace(/^\/([a-z])(?=\/|$)/i, '$1:').replaceAll('/', '\\');
}
function formatTime(time: number) {
  const date = new Date(time);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
function formatSize(item: RecycleItem) {
  return item.isDirectory || item.size === undefined
    ? ''
    : `${Math.ceil(item.size / 1024).toLocaleString()} KB`;
}
function fileType(item: RecycleItem) {
  return item.isDirectory
    ? t('recycle.bin.folder')
    : t('recycle.bin.file.type').replace('{ext}', extname(item.originalName).slice(1).toUpperCase()).trim();
}
function choose(event: MouseEvent, item: RecycleItem) {
  if (busy.value) return;
  if (event.shiftKey && focusedItem.value) {
    const start = visibleItems.value.findIndex((row) => row.storedName === focusedItem.value);
    const end = visibleItems.value.indexOf(item);
    selection.value = visibleItems.value
      .slice(Math.min(start, end), Math.max(start, end) + 1)
      .map((row) => row.storedName);
  } else if (event.ctrlKey || event.metaKey) {
    selection.value = selection.value.includes(item.storedName)
      ? selection.value.filter((name) => name !== item.storedName)
      : [...selection.value, item.storedName];
  } else selection.value = [item.storedName];
  focusedItem.value = item.storedName;
}
function selectAll() {
  selection.value = visibleItems.value.map((item) => item.storedName);
}
function invertSelection() {
  selection.value = visibleItems.value
    .filter((item) => !selection.value.includes(item.storedName))
    .map((item) => item.storedName);
}
function onItemKey(event: KeyboardEvent, item: RecycleItem) {
  const offset = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
  if (!offset) return;
  event.preventDefault();
  const index = visibleItems.value.indexOf(item);
  const next = visibleItems.value[Math.max(0, Math.min(visibleItems.value.length - 1, index + offset))];
  focusedItem.value = next.storedName;
  selection.value = [next.storedName];
  (
    itemsRef.value?.querySelector(`[data-item="${CSS.escape(next.storedName)}"]`) as HTMLElement | null
  )?.focus();
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') contextMenu.value = null;
  if ((event.target as HTMLElement).closest('input')) return;
  if (event.key === 'F5') {
    event.preventDefault();
    void refresh();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
    event.preventDefault();
    selectAll();
  }
  if (event.key === 'Delete' && selectedItems.value.length) {
    event.preventDefault();
    void handleDeleteSelected();
  }
}
async function runOperation(action: () => Promise<void>) {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  ++refreshVersion;
  try {
    await action();
    system.refershApp();
  } catch {
    error.value = t('recycle.bin.error');
  } finally {
    busy.value = false;
    await refresh();
  }
}
async function handleRestore(items: RecycleItem[]) {
  const names = items.map((item) => item.storedName);
  if (!names.length) return;
  await runOperation(async () => {
    for (const name of names) await restoreFromRecycleBin(system, name);
  });
}
async function handleDeleteSelected() {
  if (busy.value || !selectedItems.value.length) return;
  const names = selectedItems.value.map((item) => item.storedName);
  const confirmed = await Dialog.showMessageBox({
    title: t('delete'),
    message: t('recycle.bin.confirm.delete'),
    type: 'warning',
    buttons: [t('confirm'), t('cancel')],
  });
  if (confirmed.response === 0)
    await runOperation(async () => {
      for (const name of names) await permanentDelete(system, name);
    });
}
async function handleEmptyAll() {
  if (busy.value || !list.value.length) return;
  const confirmed = await Dialog.showMessageBox({
    title: t('recycle.bin.empty.all'),
    message: t('recycle.bin.confirm.empty'),
    type: 'warning',
    buttons: [t('confirm'), t('cancel')],
  });
  if (confirmed.response === 0)
    await runOperation(async () => {
      // Delete each entry through the same path as individual deletion so a failed
      // filesystem operation preserves the remaining entries in the metadata.
      const entries = await readRecycleMeta(system);
      for (const entry of entries) await permanentDelete(system, entry.storedName);
    });
}
function dismissMenu(event: MouseEvent) {
  if (!(event.target as HTMLElement).closest('.recycle-menu')) contextMenu.value = null;
}
function openMenu(event: MouseEvent, item: boolean) {
  contextMenu.value = {
    x: Math.max(0, Math.min(event.clientX, window.innerWidth - 230)),
    y: Math.max(0, Math.min(event.clientY, window.innerHeight - 110)),
    item,
  };
}
function showItemMenu(event: MouseEvent, item: RecycleItem) {
  if (busy.value) return;
  if (!selection.value.includes(item.storedName)) selection.value = [item.storedName];
  focusedItem.value = item.storedName;
  openMenu(event, true);
}
function showBackgroundMenu(event: MouseEvent) {
  openMenu(event, false);
}

async function navigate(path: string) {
  if (path === '/' || (await system.fs.exists(path))) system.openFile(path);
}
onMounted(() => {
  void refresh();
  win?.on('focus', refreshOnFocus);
  document.addEventListener('mousedown', dismissMenu);
  for (const link of quickLinks.value)
    void system.fs.exists(link.path).then((available) => {
      link.available = available;
    });
});
onUnmounted(() => {
  ++refreshVersion;
  win?.off('focus', refreshOnFocus);
  document.removeEventListener('mousedown', dismissMenu);
});
</script>

<style scoped>
.recycle-window {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  color: #000;
  font:
    12px/1.35 'Segoe UI',
    'Microsoft YaHei UI',
    'Microsoft YaHei',
    sans-serif;
  user-select: none;
  outline: 1px solid #a6a6a6;
  outline-offset: -1px;
}
.recycle-window *,
.recycle-window *::before,
.recycle-window *::after {
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
button:disabled img,
button:disabled .ribbon-icon {
  opacity: 0.4;
}
button:hover:enabled {
  background: #e5f3ff;
  border-color: #a4cef9;
}
button:focus-visible {
  outline: 1px dotted #555;
  outline-offset: -3px;
}
button.checked {
  border-color: #99d1ff;
  background: #cce8ff;
}
.mdl {
  font-family: 'SEGOEUIMDL';
  font-size: 16px;
  font-weight: normal;
  font-style: normal;
  line-height: 1;
  flex-shrink: 0;
}
.mdl.tiny {
  font-size: 8px;
}
.blue,
.cloud,
.network-icon {
  color: #278dc6;
}
.gold {
  color: #ba983e;
}
.explorer-titlebar {
  height: 30px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  touch-action: none;
}
.quick-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  width: 229px;
  min-width: 229px;
  height: 30px;
  padding-left: 8px;
}
.quick-toolbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 24px;
}
.quick-toolbar img {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.quick-toolbar .window-icon {
  margin-right: 0;
}
.quick-divider {
  height: 15px;
  width: 1px;
  background: #d9d9d9;
  margin: 0 4px;
}
.quick-toolbar button:last-child {
  width: 10px;
}
.context-heading {
  align-self: stretch;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #eaccf8;
  color: #512765;
  min-width: 116px;
  border-top: 2px solid #d7a9ee;
  white-space: nowrap;
}
.window-title {
  padding-left: 14px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.window-controls {
  height: 30px;
  display: flex;
  flex-shrink: 0;
}
.window-controls button {
  height: 30px;
  width: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.window-controls .mdl {
  font-size: 10px;
}
.window-controls button:hover {
  border-color: transparent;
  background: #e5e5e5;
}
.window-controls .window-close:hover {
  color: #fff;
  background: #e81123;
}
.ribbon-tabs {
  height: 25px;
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid #d4b3e2;
}
.ribbon-tabs > button {
  min-width: 56px;
  height: 25px;
  padding: 0 12px;
  white-space: nowrap;
}
.ribbon-tabs .active {
  background: #f5f6f7;
  border: 1px solid #dadada;
  border-bottom-color: #f5f6f7;
}
.ribbon-tabs .manage-tab {
  min-width: 116px;
}
.ribbon-tabs .manage-tab.active {
  border-color: #d4b3e2;
  border-bottom-color: #f5f6f7;
}
.ribbon-tabs .file-tab {
  background: #1979b7;
  color: #fff;
  border-color: #1979b7;
}
.ribbon-tabs > button:disabled:not(.file-tab) {
  color: #777;
}
.ribbon-tabs > button:nth-child(4) {
  min-width: 61px;
}
.tab-spacer {
  flex: 1;
}
.ribbon-tabs .ribbon-toggle,
.ribbon-tabs .help-button {
  min-width: 23px;
  width: 23px;
  padding: 0;
}
.ribbon-toggle .mdl {
  font-size: 10px;
}
.help-button .mdl {
  font-size: 14px;
  color: #1683c4;
}
.ribbon {
  display: flex;
  height: 92px;
  flex-shrink: 0;
  overflow: auto hidden;
  background: #f5f6f7;
  border-bottom: 1px solid #dadbdc;
  padding: 3px 0 2px;
}
.ribbon-group {
  position: relative;
  flex-shrink: 0;
  padding: 0 4px 16px;
  border-right: 1px solid #dedfe0;
}
.ribbon-commands {
  display: flex;
  height: 68px;
}
.large-command {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 64px;
  height: 67px;
  padding: 3px 3px 0;
  gap: 4px;
}
.large-command img,
.ribbon-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  font-size: 32px;
}
.large-command > span:last-child {
  max-width: 100%;
  white-space: pre-line;
  word-break: keep-all;
  line-height: 15px;
}
.selected-restore {
  width: 72px;
}
.manage-ribbon .ribbon-group:nth-child(2) .large-command:first-child {
  width: 54px;
}
.restore-icon {
  color: #5889b0;
}
.delete-icon {
  color: #b74343;
}
.group-label {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 15px;
  text-align: center;
  color: #646464;
  font-size: 11px;
  white-space: nowrap;
}
.selection-commands {
  min-width: 120px;
}
.selection-commands > button {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 5px;
  width: 100%;
  text-align: left;
}
.selection-commands .mdl {
  font-size: 14px;
}
.address-toolbar {
  display: flex;
  align-items: center;
  gap: 0;
  height: 36px;
  flex-shrink: 0;
  padding: 6px 12px 6px 6px;
}
.history-buttons {
  display: flex;
  align-items: center;
  gap: 3px;
}
.history-buttons button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 24px;
}
.history-buttons button:nth-child(3) {
  width: 14px;
}
.history-buttons button:disabled {
  color: #cdcdcd;
}
.history-buttons .mdl {
  font-size: 14px;
}
.history-buttons .tiny {
  font-size: 8px;
}
.address-box {
  height: 23px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 80px;
  border: 1px solid #d9d9d9;
  padding-left: 4px;
}
.address-box img {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.address-box > span:nth-last-of-type(1) {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.address-box button {
  width: 22px;
  height: 21px;
  flex-shrink: 0;
}
.address-box button:last-child {
  border-left: 1px solid #e5e5e5;
  margin-left: -5px;
}
.address-box button .mdl {
  font-size: 12px;
}
.search-box {
  display: flex;
  align-items: center;
  height: 23px;
  width: 98px;
  flex-shrink: 0;
  margin-left: 12px;
  border: 1px solid #d9d9d9;
}
.search-box input {
  width: 100%;
  min-width: 0;
  height: 21px;
  border: 0;
  padding: 0 8px;
  outline: none;
  background: #fff;
}
.search-box:focus-within {
  border-color: #0078d7;
}
.search-box > .mdl {
  font-size: 12px;
  margin: 0 7px 0 2px;
  color: #666;
}
.explorer-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.navigation-pane {
  width: 156px;
  flex-shrink: 0;
  border-right: 1px solid #e5e5e5;
  overflow: auto;
  padding: 9px 0;
}
.nav-heading,
.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  width: 100%;
  padding: 0 8px;
  text-align: left;
  white-space: nowrap;
}
.nav-heading {
  margin-bottom: 2px;
}
.tree-chevron {
  font-size: 8px;
  width: 10px;
  color: #777;
}
.tree-indent {
  width: 10px;
  flex-shrink: 0;
}
.nav-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.quick-star {
  font-size: 14px;
  color: #26a1d5;
}
.nav-item.child {
  padding-left: 34px;
  gap: 7px;
}
.nav-item .mdl:not(.tree-chevron):not(.pin) {
  width: 16px;
  font-size: 16px;
  text-align: center;
}
.nav-item img {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.nav-item .pin {
  margin-left: auto;
  font-size: 10px;
  color: #999;
}
.nav-item:disabled {
  color: #777;
}
.nav-item:disabled > .mdl:not(.pin) {
  opacity: 0.55;
}
.nav-item.current {
  background: #d9d9d9;
  border-color: transparent;
}
.nav-item.section-start {
  margin-top: 12px;
}
.files-pane {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.file-scroll {
  min-height: 0;
  flex: 1;
  overflow: auto;
  position: relative;
  padding-left: 14px;
}
.file-scroll::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}
.file-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.file-scroll::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border: 2px solid #f1f1f1;
}
.file-scroll::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
.file-table {
  width: 1224px;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  font-size: 12px;
}
.file-table thead {
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 1;
}
.file-table th {
  padding: 0;
  font-weight: 400;
  height: 25px;
  text-align: left;
  border-right: 1px solid #e5e5e5;
}
.file-table th button {
  position: relative;
  width: 100%;
  height: 25px;
  text-align: left;
  padding: 0 7px;
  color: #555;
}
.file-table th button:hover {
  border-color: transparent;
}
.sort-mark {
  position: absolute;
  top: 0;
  left: 50%;
  font-size: 8px;
  color: #777;
}
.file-table td {
  height: 23px;
  padding: 2px 7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
  color: #666;
}
.file-table tr:hover td {
  background: #e5f3ff;
}
.file-table tr.chosen td {
  background: #cce8ff;
  border-color: #99d1ff;
}
.file-table tr.chosen td:first-child {
  border-left: 1px solid #99d1ff;
  padding-left: 6px;
}
.file-table tr.chosen td:last-child {
  border-right: 1px solid #99d1ff;
}
.file-table tr:focus {
  outline: 1px dotted #555;
  outline-offset: -2px;
}
.file-name {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #000;
}
.file-name img {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  object-fit: contain;
}
.file-name span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.size-cell {
  text-align: right;
}
.empty-message {
  margin: 15px 0 0;
  padding: 0 16px;
  text-align: center;
  color: #666;
  font-size: 12px;
}
.operation-error {
  color: #b42318;
  background: #fff6f5;
  padding: 5px 12px;
  border-top: 1px solid #e9cecc;
}
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 100px);
  gap: 8px;
  padding: 12px 8px;
}
.file-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 100px;
  padding: 5px;
}
.file-tile img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}
.file-tile span {
  width: 100%;
  overflow-wrap: anywhere;
  max-height: 48px;
  overflow: hidden;
}
.file-tile.chosen {
  background: #cce8ff;
  border-color: #99d1ff;
}
.explorer-status {
  display: flex;
  align-items: center;
  height: 23px;
  flex-shrink: 0;
  padding-left: 12px;
  gap: 18px;
  background: #fff;
  color: #555;
  border-top: 1px solid #f0f0f0;
}
.status-spacer {
  flex: 1;
}
.explorer-status button {
  height: 22px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.explorer-status .mdl {
  font-size: 16px;
}
.recycle-menu {
  font:
    12px/1.35 'Segoe UI',
    'Microsoft YaHei UI',
    'Microsoft YaHei',
    sans-serif;
  color: #000;
  position: fixed;
  z-index: 10000;
  min-width: 220px;
  padding: 3px;
  border: 1px solid #a0a0a0;
  background: #f2f2f2;
  box-shadow: 2px 2px 3px #0004;
}
.recycle-menu button {
  display: block;
  width: 100%;
  height: 26px;
  padding: 0 30px;
  text-align: left;
  border: 0;
}
.recycle-menu button:hover:enabled {
  background: #91c9f7;
}
.menu-separator {
  height: 1px;
  background: #d7d7d7;
  margin: 3px 0 3px 26px;
}
</style>
