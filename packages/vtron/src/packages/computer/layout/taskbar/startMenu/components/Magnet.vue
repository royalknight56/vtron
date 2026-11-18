<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <section class="tiles start-scroll" :aria-label="i18n('startMenu.pinnedApps')">
    <h2>{{ i18n('startMenu.pinnedApps') }}</h2>
    <div
      ref="grid"
      class="tile-grid"
      :style="{ '--columns': tileColumns, '--rows': gridRows }"
      @dragover="dragOver"
      @drop="drop"
      @dragleave="leave"
    >
      <button
        v-for="item in appList"
        :key="item.path"
        type="button"
        draggable="true"
        class="tile"
        :class="[display[item.path].size, { moving: dragging?.path === item.path }]"
        :style="tileStyle(display[item.path])"
        :title="item.name.replace(/\.exe$/i, '')"
        @click.stop="handle(item)"
        @contextmenu.stop.prevent="menu($event, item)"
        @dragstart="dragStart($event, item.path)"
        @dragend="endDrag"
      >
        <FileIcon class="tile-icon" :file="item" />
        <span class="tile-name">{{ item.name.replace(/\.exe$/i, '') }}</span>
      </button>
    </div>
  </section>
</template>
<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import type { System, VtronFileWithoutContent } from '@packages/kernel';
import type { StartTilePlacement, StartTileSize } from '@/packages/type/type';
import { i18n } from '../../../../i18n';
import { useAppOpen } from '@/packages/computer/hook/useAppOpen';
import FileIcon from '@/packages/computer/application/FileIcon.vue';
import { shortcutPinAction } from '@/packages/computer/utils/taskbarPins';
import { arrangeTiles, tileColumns, tileSpans, type TileLayout } from '../tileLayout';

const sys = inject<System>('system')!;
const { openapp, appList } = useAppOpen('magnet', sys);
const paths = computed(() => appList.map((item) => item.path));
const layout = computed(() => arrangeTiles(paths.value, sys.getConfig('desktopPreferences')?.startTiles));
const grid = ref<HTMLElement>();
const dragging = ref<{ path: string; offsetX: number; offsetY: number; appendRows: number }>();
const target = ref<StartTilePlacement>();
const display = computed(() =>
  dragging.value && target.value
    ? arrangeTiles(paths.value, layout.value, { path: dragging.value.path, placement: target.value })
    : layout.value
);
function bottom(tiles: TileLayout) {
  return Math.max(0, ...Object.values(tiles).map((tile) => tile.row + tileSpans[tile.size][1]));
}
const gridRows = computed(() =>
  Math.max(1, bottom(display.value), bottom(layout.value) + (dragging.value?.appendRows ?? 0))
);
function tileStyle(tile: StartTilePlacement) {
  const [w, h] = tileSpans[tile.size];
  return { gridColumn: tile.column + 1 + ' / span ' + w, gridRow: tile.row + 1 + ' / span ' + h };
}
async function save(tiles: TileLayout) {
  try {
    await sys.setConfig('desktopPreferences', { ...sys.getConfig('desktopPreferences'), startTiles: tiles });
  } catch {
    sys.createNotify({ title: i18n('startMenu.pinnedApps'), content: i18n('startMenu.tile.saveError') });
  }
}
function handle(item: VtronFileWithoutContent) {
  sys.emitEvent('magnet.item.click', item);
  openapp(item);
}
async function menu(event: MouseEvent, item: VtronFileWithoutContent) {
  const pin = await shortcutPinAction(sys, item);
  const sizes = (Object.keys(tileSpans) as StartTileSize[]).map((size) => ({
    label: (layout.value[item.path].size === size ? '✓  ' : '') + i18n(`startMenu.tile.${size}`),
    click: () => {
      const tile = layout.value[item.path];
      if (tile && tile.size !== size)
        save(arrangeTiles(paths.value, layout.value, { path: item.path, placement: { ...tile, size } }));
    },
  }));
  sys
    .buildFromTemplate([{ label: i18n('startMenu.tile.resize'), submenu: sizes }, ...(pin ? [pin] : [])])
    .popup(event);
}
function gridStep() {
  const el = grid.value!;
  const gap = parseFloat(getComputedStyle(el).columnGap);
  return (el.getBoundingClientRect().width + gap) / tileColumns;
}
function dragStart(event: DragEvent, path: string) {
  if (!event.dataTransfer) return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const step = gridStep();
  dragging.value = {
    path,
    appendRows: 0,
    offsetX: (event.clientX - rect.left) / step,
    offsetY: (event.clientY - rect.top) / step,
  };
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('application/x-vtron-start-tile', path);
}
function updateTarget(event: DragEvent) {
  const drag = dragging.value;
  if (!drag || !grid.value || !layout.value[drag.path]) return;
  const rect = grid.value.getBoundingClientRect();
  const step = gridStep();
  const size = layout.value[drag.path].size;
  // Extend the drop area only when the pointer reaches its bottom edge.
  if (event.clientY >= rect.bottom - step / 2) drag.appendRows = tileSpans[size][1];
  const column = Math.max(
    0,
    Math.min(tileColumns - tileSpans[size][0], Math.round((event.clientX - rect.left) / step - drag.offsetX))
  );
  const availableRows = Math.max(
    bottom(layout.value) + drag.appendRows,
    Math.floor(grid.value.parentElement!.clientHeight / step)
  );
  const row = Math.max(
    0,
    Math.min(availableRows - tileSpans[size][1], Math.round((event.clientY - rect.top) / step - drag.offsetY))
  );
  if (target.value?.column !== column || target.value?.row !== row) target.value = { column, row, size };
}
function dragOver(event: DragEvent) {
  if (!dragging.value) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  updateTarget(event);
}
function leave(event: DragEvent) {
  if (!(event.relatedTarget instanceof Node) || !grid.value?.contains(event.relatedTarget))
    target.value = undefined;
}
function endDrag() {
  dragging.value = undefined;
  target.value = undefined;
}
function drop(event: DragEvent) {
  if (!dragging.value) return;
  event.preventDefault();
  event.stopPropagation();
  updateTarget(event);
  if (target.value) save(display.value);
  endDrag();
}
</script>
<style scoped>
.tiles {
  container-type: inline-size;
  scrollbar-gutter: stable;
  overflow-anchor: none;
  overscroll-behavior: contain;
  padding: 8px 10px 16px 6px;
}
.tiles h2 {
  margin: 0;
  height: 40px;
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 400;
}
.tile-grid {
  --gap: 4px;
  display: grid;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  grid-template-rows: repeat(var(--rows), calc((100cqw + var(--gap)) / var(--columns) - var(--gap)));
  gap: var(--gap);
  min-height: calc(100% - 40px);
  align-content: start;
}
.tile-grid .tile {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 0;
  padding: 0;
  background: rgb(255 255 255 / 48%);
  overflow: hidden;
}
.tile:hover {
  box-shadow: inset 0 0 0 2px rgb(0 0 0 / 18%);
}
.tile:active {
  background: rgb(255 255 255 / 72%);
}
.tile-grid .moving {
  background: rgb(0 103 184 / 18%);
  outline: 2px solid #0078d7;
  outline-offset: -2px;
}
.moving > * {
  opacity: 0.45;
}
.tile .tile-icon {
  width: min(35%, 40px);
  height: min(35%, 40px);
  pointer-events: none;
}
.small .tile-icon {
  width: 54%;
  height: 54%;
}
.large .tile-icon {
  width: min(35%, 58px);
  height: min(35%, 58px);
}
.tile-name {
  position: absolute;
  inset: auto 7px 5px;
  text-align: left;
  font:
    12px/16px 'Segoe UI',
    'Microsoft YaHei UI',
    sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.small .tile-name {
  display: none;
}
</style>
