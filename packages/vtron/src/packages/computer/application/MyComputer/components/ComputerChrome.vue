<template>
  <div class="computer-chrome">
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
        <img :src="computerIcon" class="window-icon" alt="" /><span class="quick-divider"></span>
        <button
          :disabled="!hasSelection"
          :aria-label="t('props')"
          :title="t('props')"
          @click="$emit('properties')"
        >
          <img :src="propertiesIcon" alt="" />
        </button>
        <button disabled :aria-label="t('new.folder')" :title="t('new.folder')">
          <img :src="folderIcon" alt="" />
        </button>
        <button disabled :aria-label="t('computer.quick.toolbar')">
          <span class="mdl tiny" aria-hidden="true">&#xE70D;</span>
        </button>
      </div>
      <span class="window-title">{{ title }}</span>
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
        class="main-tab"
        :class="{ active: ribbonTab === 'main' }"
        :aria-pressed="ribbonTab === 'main'"
        @click="showTab('main')"
      >
        {{ root ? t('computer.tab') : t('recycle.bin.home') }}
      </button>
      <button v-if="!root" disabled>{{ t('recycle.bin.share') }}</button>
      <button
        :class="{ active: ribbonTab === 'view' }"
        :aria-pressed="ribbonTab === 'view'"
        @click="showTab('view')"
      >
        {{ t('recycle.bin.view') }}
      </button>
      <span class="tab-spacer"></span>
      <button
        class="ribbon-toggle"
        :aria-label="collapsed ? t('recycle.bin.expand.ribbon') : t('recycle.bin.collapse.ribbon')"
        @click="collapsed = !collapsed"
      >
        <span class="mdl" aria-hidden="true">{{ collapsed ? '\uE70D' : '\uE70E' }}</span>
      </button>
      <button class="help-button" disabled :aria-label="t('computer.help')">
        <span class="mdl" aria-hidden="true">&#xE897;</span>
      </button>
    </nav>
    <div v-if="!collapsed" class="ribbon">
      <template v-if="ribbonTab === 'main' && root">
        <section class="ribbon-group location-group">
          <div class="ribbon-commands">
            <button
              class="large-command properties-command"
              :disabled="!hasSelection"
              @click="$emit('properties')"
            >
              <img :src="propertiesIcon" alt="" /><span>{{ t('props') }}</span>
            </button>
            <button
              class="large-command small-command"
              :disabled="!hasSelection"
              @click="$emit('openSelected')"
            >
              <img :src="openIcon" alt="" /><span>{{ t('open') }}</span>
            </button>
            <button class="large-command small-command" disabled>
              <img :src="renameIcon" alt="" /><span>{{ t('rename') }}</span>
            </button>
          </div>
          <div class="group-label">{{ t('computer.location') }}</div>
        </section>
        <section class="ribbon-group network-group">
          <div class="ribbon-commands">
            <button class="large-command media-command" disabled>
              <img :src="mediaIcon" alt="" /><span>{{ ribbonLabel(t('computer.access.media')) }}</span>
            </button>
            <button class="large-command network-command" disabled>
              <img :src="mapDriveIcon" alt="" /><span>{{ ribbonLabel(t('computer.map.drive')) }}</span>
            </button>
            <button class="large-command network-command" disabled>
              <img :src="addLocationIcon" alt="" /><span>{{ ribbonLabel(t('computer.add.location')) }}</span>
            </button>
          </div>
          <div class="group-label">{{ t('computer.network') }}</div>
        </section>
        <section class="ribbon-group system-group">
          <div class="ribbon-commands">
            <button class="large-command settings-command" disabled>
              <img :src="settingsIcon" alt="" /><span>{{ ribbonLabel(t('computer.settings')) }}</span>
            </button>
            <div class="small-commands">
              <button disabled>
                <span class="mdl" aria-hidden="true">&#xE74D;</span>{{ t('computer.uninstall') }}
              </button>
              <button disabled>
                <img :src="systemPropertiesIcon" alt="" />{{ t('computer.system.properties') }}
              </button>
              <button disabled>
                <span class="mdl" aria-hidden="true">&#xE90F;</span>{{ t('computer.manage') }}
              </button>
            </div>
          </div>
          <div class="group-label">{{ t('computer.system') }}</div>
        </section>
      </template>
      <template v-else-if="ribbonTab === 'main'">
        <section class="ribbon-group">
          <div class="ribbon-commands">
            <button class="large-command" disabled>
              <span class="mdl ribbon-icon" aria-hidden="true">&#xE77F;</span
              ><span>{{ t('paste') }}</span></button
            ><button class="large-command" disabled>
              <span class="mdl ribbon-icon" aria-hidden="true">&#xE8C8;</span><span>{{ t('copy') }}</span>
            </button>
          </div>
          <div class="group-label">{{ t('computer.clipboard') }}</div>
        </section>
        <section class="ribbon-group">
          <div class="ribbon-commands">
            <button class="large-command" :disabled="!hasSelection" @click="$emit('openSelected')">
              <img :src="openIcon" alt="" /><span>{{ t('open') }}</span></button
            ><button class="large-command" disabled>
              <span class="mdl ribbon-icon" aria-hidden="true">&#xE74D;</span
              ><span>{{ t('delete') }}</span></button
            ><button class="large-command" disabled>
              <img :src="renameIcon" alt="" /><span>{{ t('rename') }}</span>
            </button>
          </div>
          <div class="group-label">{{ t('computer.organize') }}</div>
        </section>
        <section class="ribbon-group">
          <div class="ribbon-commands">
            <button class="large-command" :disabled="!canCreate" @click="$emit('createFolder')">
              <img :src="folderIcon" alt="" /><span>{{ t('new.folder') }}</span></button
            ><button class="large-command" :disabled="!hasSelection" @click="$emit('properties')">
              <img :src="propertiesIcon" alt="" /><span>{{ t('props') }}</span>
            </button>
          </div>
          <div class="group-label">{{ t('new') }}</div>
        </section>
      </template>
      <template v-else>
        <section class="ribbon-group pane-commands">
          <button
            :class="{ checked: showNavigation }"
            :aria-pressed="showNavigation"
            @click="$emit('toggleNavigation')"
          >
            <span class="mdl" aria-hidden="true">&#xE8A0;</span>{{ t('recycle.bin.navigation.pane') }}</button
          ><button
            :class="{ checked: showPreview }"
            :aria-pressed="showPreview"
            @click="$emit('togglePreview')"
          >
            <span class="mdl" aria-hidden="true">&#xE8A1;</span>{{ t('recycle.bin.preview.pane') }}</button
          ><button disabled>
            <span class="mdl" aria-hidden="true">&#xE946;</span>{{ t('detail.info') }}
          </button>
          <div class="group-label">{{ t('recycle.bin.panes') }}</div>
        </section>
        <section class="ribbon-group layout-group">
          <div class="layout-commands">
            <button
              v-for="item in views"
              :key="item.mode"
              :class="{ checked: view === item.mode }"
              :aria-pressed="view === item.mode"
              @click="$emit('view', item.mode)"
            >
              <span class="mdl" aria-hidden="true">{{ item.icon }}</span
              >{{ t(item.label) }}
            </button>
          </div>
          <div class="group-label">{{ t('recycle.bin.layout') }}</div>
        </section>
        <section class="ribbon-group pane-commands">
          <button
            :class="{ checked: showFilters }"
            :aria-pressed="showFilters"
            @click="$emit('toggleFilters')"
          >
            <span class="mdl" aria-hidden="true">&#xE71C;</span>{{ t('filter.type') }}</button
          ><button disabled>
            <span class="mdl" aria-hidden="true">&#xE713;</span>{{ t('recycle.bin.options') }}
          </button>
          <div class="group-label">{{ t('computer.show.hide') }}</div>
        </section>
      </template>
    </div>
    <div class="address-toolbar">
      <div class="history-buttons">
        <button :disabled="!canBack" :aria-label="t('back')" :title="t('back')" @click="$emit('back')">
          <span class="mdl" aria-hidden="true">&#xE72B;</span></button
        ><button
          :disabled="!canForward"
          :aria-label="t('computer.forward')"
          :title="t('computer.forward')"
          @click="$emit('forward')"
        >
          <span class="mdl" aria-hidden="true">&#xE72A;</span></button
        ><button disabled :aria-label="t('computer.history')">
          <span class="mdl tiny" aria-hidden="true">&#xE70D;</span></button
        ><button
          :disabled="root"
          :aria-label="t('computer.up')"
          :title="t('computer.up')"
          @click="$emit('up')"
        >
          <span class="mdl" aria-hidden="true">&#xE74A;</span>
        </button>
      </div>
      <div class="address-box" @dblclick="startAddressEdit">
        <template v-if="!editingAddress"
          ><img :src="computerIcon" alt="" /><button class="breadcrumb" @click="$emit('navigate', '/')">
            <span class="mdl tiny" aria-hidden="true">&#xE76C;</span>{{ t('computer') }}</button
          ><template v-for="part in breadcrumbs" :key="part.path"
            ><span class="mdl tiny" aria-hidden="true">&#xE76C;</span
            ><button class="breadcrumb" @click="$emit('navigate', part.path)">
              {{ part.label }}
            </button></template
          >
          <div class="address-space" @click="startAddressEdit"></div
        ></template>
        <input
          v-else
          ref="addressInput"
          v-model="addressText"
          :aria-label="t('computer.address')"
          @keydown.enter="submitAddress"
          @keydown.esc="editingAddress = false"
          @blur="editingAddress = false"
        />
        <button class="address-edit" :aria-label="t('computer.address')" @click="startAddressEdit">
          <span class="mdl tiny" aria-hidden="true">&#xE70D;</span></button
        ><button
          class="refresh-button"
          :aria-label="t('refresh')"
          :title="t('refresh')"
          @click="$emit('refresh')"
        >
          <span class="mdl" aria-hidden="true">&#xE72C;</span>
        </button>
      </div>
      <div class="search-box">
        <input
          v-model="searchText"
          type="search"
          :aria-label="t('computer.search').replace('{name}', title)"
          :placeholder="t('computer.search').replace('{name}', title)"
          @input="$emit('searchInput', searchText)"
          @keydown.enter="$emit('search', searchText)"
          @keydown.esc="
            searchText = '';
            $emit('searchInput', '');
          "
        /><span class="mdl" aria-hidden="true">&#xE721;</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue';
import { BrowserWindow } from '@/packages/services';
import { vDragable } from '@/packages/computer/layout/windowGroup/MakeDragable';
import { i18n as t } from '@/packages/computer/i18n';
import computerIcon from '@packages/assets/recycle-bin/this-pc.png';
import folderIcon from '@packages/assets/folder.png';
import propertiesIcon from '@packages/assets/my-computer/properties.png';
import openIcon from '@packages/assets/my-computer/open-item.png';
import renameIcon from '@packages/assets/my-computer/rename.png';
import mediaIcon from '@packages/assets/my-computer/access-media.png';
import mapDriveIcon from '@packages/assets/my-computer/map-network-drive.png';
import addLocationIcon from '@packages/assets/my-computer/add-network-location.png';
import settingsIcon from '@packages/assets/my-computer/open-settings.png';
import systemPropertiesIcon from '@packages/assets/my-computer/system-properties-small.png';

const props = defineProps<{
  path: string;
  title: string;
  root: boolean;
  canBack: boolean;
  canForward: boolean;
  hasSelection: boolean;
  canCreate: boolean;
  view: string;
  showPreview: boolean;
  showNavigation: boolean;
  showFilters: boolean;
}>();
const emit = defineEmits<{
  (
    event:
      | 'back'
      | 'forward'
      | 'up'
      | 'refresh'
      | 'togglePreview'
      | 'toggleNavigation'
      | 'toggleFilters'
      | 'openSelected'
      | 'properties'
      | 'createFolder'
  ): void;
  (event: 'navigate' | 'search' | 'searchInput' | 'view', value: string): void;
}>();
const win = inject<BrowserWindow>('browserWindow');
const maximized = computed(() => win?.isMaximized() ?? false);
const ribbonTab = ref<'main' | 'view'>('main');
const collapsed = ref(false);
const editingAddress = ref(false);
const addressText = ref('');
const addressInput = ref<HTMLInputElement>();
const searchText = ref('');
const views: { mode: string; icon: string; label: Parameters<typeof t>[0] }[] = [
  { mode: 'big', icon: '\uE8A9', label: 'large.icon' },
  { mode: 'middle', icon: '\uE80A', label: 'middle.icon' },
  { mode: 'icon', icon: '\uE80A', label: 'small.icon' },
  { mode: 'list', icon: '\uE8FD', label: 'list' },
  { mode: 'detail', icon: '\uE8A0', label: 'detail.info' },
];
const breadcrumbs = computed(() => {
  if (props.path.startsWith('search:')) return [{ path: props.path, label: t('computer.search.results') }];
  const parts = props.path.split('/').filter(Boolean);
  const labels: Record<string, string> = {
    Desktop: t('recycle.bin.desktop'),
    Documents: t('recycle.bin.documents'),
    Downloads: t('recycle.bin.downloads'),
    Photo: t('recycle.bin.pictures'),
    Music: t('recycle.bin.music'),
    Videos: t('recycle.bin.videos'),
    Note: t('computer.notes'),
  };
  return parts.map((part: string, index: number) => ({
    path: '/' + parts.slice(0, index + 1).join('/'),
    label: index === 0 ? `${t('local.disk')} (${part}:)` : labels[part] || part,
  }));
});
function ribbonLabel(text: string) {
  const labels: Record<string, string> = {
    访问媒体: '访问\n媒体',
    映射网络驱动器: '映射网络\n驱动器',
    添加一个网络位置: '添加一个\n网络位置',
    打开设置: '打开\n设置',
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
async function startAddressEdit() {
  addressText.value = props.path.replace(/^\/([a-z])(?=\/|$)/i, '$1:').replaceAll('/', '\\');
  editingAddress.value = true;
  await nextTick();
  addressInput.value?.focus();
  addressInput.value?.select();
}
function submitAddress() {
  const value = addressText.value.trim();
  editingAddress.value = false;
  if (value)
    emit(
      'navigate',
      value.replace(/^([a-z]):/i, (_, drive: string) => '/' + drive.toUpperCase()).replaceAll('\\', '/')
    );
}
watch(
  () => props.path,
  () => {
    searchText.value = '';
    editingAddress.value = false;
  }
);
</script>

<style scoped>
.computer-chrome {
  flex-shrink: 0;
  color: #000;
  background: #fff;
  font:
    12px/1.35 'Segoe UI',
    'Microsoft YaHei UI',
    'Microsoft YaHei',
    sans-serif;
  user-select: none;
}
.computer-chrome *,
.computer-chrome *::before,
.computer-chrome *::after {
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
  width: 100px;
  min-width: 100px;
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
  border-bottom: 1px solid #dadada;
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
  width: 202px;
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

.ribbon-tabs .main-tab {
  min-width: 80px;
}
.ribbon-tabs > button:nth-child(4) {
  min-width: 56px;
}
.location-group,
.network-group,
.system-group {
  padding-left: 2px;
  padding-right: 2px;
}
.large-command.properties-command {
  width: 62px;
}
.large-command.small-command {
  width: 46px;
}
.large-command.media-command {
  width: 54px;
}
.large-command.network-command {
  width: 76px;
}
.large-command.settings-command {
  width: 58px;
}
.small-commands {
  padding: 0 2px;
  min-width: 178px;
}
.small-commands button {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  width: 100%;
  padding: 0 3px;
  text-align: left;
  white-space: nowrap;
}
.small-commands img,
.small-commands .mdl {
  width: 16px;
  height: 16px;
  font-size: 16px;
  object-fit: contain;
}
.small-commands button:disabled img {
  opacity: 0.45;
}
.pane-commands {
  min-width: 124px;
}
.pane-commands > button {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  height: 22px;
  padding: 0 5px;
}
.pane-commands .mdl,
.layout-commands .mdl {
  font-size: 14px;
}
.layout-group {
  width: 266px;
}
.layout-commands {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 23px;
}
.layout-commands button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 4px;
  white-space: nowrap;
}
.address-box {
  overflow: hidden;
  gap: 4px;
}
.breadcrumb {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 3px;
  height: 21px;
  font-size: 12px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.address-space {
  min-width: 5px;
  flex: 1;
  align-self: stretch;
}
.address-box button.breadcrumb {
  width: auto;
}
.address-box > input {
  min-width: 20px;
  flex: 1;
  border: none;
  outline: none;
  padding: 0;
  height: 21px;
}
.address-box .address-edit {
  width: 22px;
}
.address-box .refresh-button {
  margin-left: 0;
}
@media (max-width: 650px) {
  .search-box {
    width: 150px;
  }
}
</style>
