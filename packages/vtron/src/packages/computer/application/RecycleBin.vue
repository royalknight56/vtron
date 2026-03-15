<template>
  <div class="uper">
    <div class="group">
      <div class="button" @click="refresh()">{{ i18n('refresh') }}</div>
      <div class="button button--danger" :class="{ disabled: list.length === 0 }" @click="handleEmptyAll">
        {{ i18n('recycle.bin.empty.all') }}
      </div>
    </div>
  </div>
  <div class="main">
    <div class="desk-outer">
      <div v-if="list.length === 0" class="recycle-empty">
        {{ i18n('recycle.bin.empty') }}
      </div>
      <template v-else>
        <div class="file-bar mode-detail">
          <div class="file-item_img"></div>
          <div class="file-item_title">{{ i18n('file') }}</div>
          <div class="file-item_type">{{ i18n('recycle.bin.original.path') }}</div>
          <div class="file-item_type">{{ i18n('recycle.bin.deleted.at') }}</div>
          <div class="file-item_type">{{ i18n('recycle.bin.restore') }}</div>
        </div>
        <div
          v-for="item in list"
          :key="item.storedName"
          class="file-row"
          :class="{ chosen: selected === item.storedName }"
          @click="selected = item.storedName"
          @contextmenu.stop.prevent="handleRightClick($event, item)"
        >
          <div class="file-item_img">
            <img draggable="false" width="24" :src="item.isDirectory ? folderIcon : unknownIcon" />
          </div>
          <div class="file-item_title" :title="item.originalName">{{ item.originalName }}</div>
          <div class="file-item_type" :title="item.originalPath">{{ item.originalPath }}</div>
          <div class="file-item_type">{{ formatTime(item.deletedAt) }}</div>
          <div class="file-item_type file-item_actions">
            <div class="button" @click.stop="handleRestore(item.storedName)">
              {{ i18n('recycle.bin.restore') }}
            </div>
            <div class="button button--danger" @click.stop="handleDelete(item.storedName)">
              {{ i18n('delete') }}
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, inject } from 'vue';
import { System } from '@/packages/kernel';
import { i18n } from '@/packages/computer/i18n';
import {
  readRecycleMeta,
  restoreFromRecycleBin,
  permanentDelete,
  emptyRecycleBin,
  type RecycleMeta,
} from './components/fileOpt';
import { Dialog } from '@/packages/services';
import folderIcon from '@packages/assets/folder.png';
import unknownIcon from '@packages/assets/unknown.png';

const system = inject<System>('system')!;
const list = ref<RecycleMeta[]>([]);
const selected = ref<string>('');

async function refresh() {
  list.value = await readRecycleMeta(system);
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function handleRestore(storedName: string) {
  await restoreFromRecycleBin(system, storedName);
  system.refershApp();
  await refresh();
}

async function handleDelete(storedName: string) {
  const confirmed = await Dialog.showMessageBox({
    title: i18n('tips'),
    message: i18n('recycle.bin.confirm.delete'),
    type: 'warning',
  });
  if (!confirmed) return;
  await permanentDelete(system, storedName);
  await refresh();
}

async function handleEmptyAll() {
  if (list.value.length === 0) return;
  const confirmed = await Dialog.showMessageBox({
    title: i18n('tips'),
    message: i18n('recycle.bin.confirm.empty'),
    type: 'warning',
  });
  if (!confirmed) return;
  await emptyRecycleBin(system);
  await refresh();
}

function handleRightClick(mouse: MouseEvent, item: RecycleMeta) {
  selected.value = item.storedName;
  system
    .buildFromTemplate([
      {
        label: i18n('recycle.bin.restore'),
        click: () => handleRestore(item.storedName),
      },
      {
        label: i18n('recycle.bin.delete.permanent'),
        click: () => handleDelete(item.storedName),
      },
    ])
    .popup(mouse);
}

onMounted(refresh);
</script>

<style lang="scss" scoped>
.uper {
  background-color: rgba(255, 235, 205, 0);
  font-size: 12px;
  font-weight: 300;
  --button-item-height: 30px;
}

.group {
  display: flex;
  border-bottom: 1px solid rgba(134, 134, 134, 0.267);
  user-select: none;
}

.button {
  cursor: pointer;
  text-align: center;
  transition: all 0.1s;
  background: #ffffff;
  font-family: sans-serif;
  font-size: 12px;
  padding: 0px 8px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  user-select: none;

  &:hover {
    background-color: #1b6bad;
    color: white;
  }

  &.disabled {
    opacity: 0.4;
    pointer-events: none;
  }
}

.button--danger:hover {
  background-color: #c42b1c;
}

.main {
  display: flex;
  height: 100%;
  position: relative;
  top: 4px;
}

.desk-outer {
  flex: 1;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
}

.recycle-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 14px;
  user-select: none;
}

.file-bar,
.file-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 28px;
  width: 100%;
  margin: 0;
  padding: 0 4px;
  font-size: var(--ui-font-size);
  user-select: none;
  box-sizing: border-box;
}

.file-bar {
  font-weight: 600;
  border-bottom: 1px solid rgba(134, 134, 134, 0.267);
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

.file-row {
  cursor: default;
  border-bottom: 1px solid rgba(134, 134, 134, 0.1);

  &:hover {
    background-color: #b9e3fd5a;
  }

  &.chosen {
    background-color: #b9e3fd90;
  }
}

.file-item_img {
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-item_title {
  flex: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 4px;
}

.file-item_type {
  flex: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-dark-hover);
  padding: 0 4px;
}

.file-item_actions {
  display: flex;
  gap: 2px;
  justify-content: flex-end;
  overflow: visible;

  .button {
    font-size: 11px;
    height: 18px;
    padding: 0 6px;
    border-radius: 3px;
  }
}
</style>
