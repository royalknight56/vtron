<template>
  <div class="win10-app-frame" :style="{ background, color }">
    <header
      v-dragable
      class="win10-app-titlebar"
      :style="{ background: titlebarBackground || background }"
      @mousedown.capture="win?.moveTop()"
      @touchstart.capture.passive="win?.moveTop()"
      @mousedown.stop
      @touchstart.stop.passive
      @dblclick="toggleMaximize"
    >
      <div
        class="titlebar-leading"
        @mousedown="stopControlDrag"
        @touchstart.passive="stopControlDrag"
        @dblclick="stopControlDrag"
      >
        <slot name="title"
          ><img v-if="icon" :src="icon" alt="" /><span>{{ title }}</span></slot
        >
      </div>
      <div class="window-controls" @mousedown.stop @touchstart.stop.passive @dblclick.stop>
        <button v-if="!compact" aria-label="最小化窗口" title="最小化" @click="win?.minimize()">
          <span class="mdl" aria-hidden="true">&#xE921;</span>
        </button>
        <button
          v-if="!compact"
          :aria-label="maximized ? '还原窗口' : '最大化窗口'"
          :title="maximized ? '还原' : '最大化'"
          :disabled="!win?.isResizable()"
          @click="toggleMaximize"
        >
          <span class="mdl" aria-hidden="true">{{ maximized ? '\uE923' : '\uE922' }}</span>
        </button>
        <button
          class="close-button"
          aria-label="关闭窗口"
          title="关闭"
          :disabled="closing"
          @click="requestClose"
        >
          <span class="mdl" aria-hidden="true">&#xE8BB;</span>
        </button>
      </div>
    </header>
    <main class="win10-app-body"><slot /></main>
  </div>
</template>
<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue';
import { BrowserWindow, vDragable } from 'vtron';
const props = withDefaults(
  defineProps<{
    title: string;
    icon?: string;
    background?: string;
    color?: string;
    titlebarBackground?: string;
    compact?: boolean;
    beforeClose?: () => boolean | Promise<boolean>;
  }>(),
  { background: '#f2f2f2', color: '#111', compact: false }
);
const win = inject<BrowserWindow>('browserWindow');
const maximized = computed(() => win?.isMaximized() ?? false);
const closing = ref(false);
const originalClose = win?.close;
const guardedClose = () => void requestClose();
onMounted(() => {
  // BrowserWindow has no cancellable close event; protect taskbar and menu closes too.
  if (win && props.beforeClose) win.close = guardedClose;
});
onUnmounted(() => {
  if (win && win.close === guardedClose && originalClose) win.close = originalClose;
});
function toggleMaximize() {
  if (props.compact || !win?.isResizable()) return;
  if (maximized.value) win.unmaximize();
  else win.maximize();
}
function stopControlDrag(event: Event) {
  if ((event.target as Element).closest('button, input, select, textarea, a, [contenteditable]'))
    event.stopPropagation();
}
async function requestClose() {
  if (closing.value) return;
  closing.value = true;
  try {
    if ((await props.beforeClose?.()) !== false) originalClose?.call(win);
  } finally {
    closing.value = false;
  }
}
</script>
<style scoped>
.win10-app-frame {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  outline: 1px solid #999;
  outline-offset: -1px;
  font:
    12px/1.35 'Segoe UI',
    'Microsoft YaHei UI',
    'Microsoft YaHei',
    sans-serif;
}
.win10-app-titlebar {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 32px;
  touch-action: none;
  user-select: none;
}
.titlebar-leading {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 7px;
  padding-left: 12px;
  overflow: hidden;
  white-space: nowrap;
}
.titlebar-leading > img {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.titlebar-leading > span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.window-controls {
  display: flex;
  align-self: stretch;
  flex-shrink: 0;
}
.window-controls button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: inherit;
  background: transparent;
  cursor: default;
}
.window-controls button:hover:enabled {
  background: #00000012;
}
.window-controls .close-button:hover:enabled {
  color: white;
  background: #e81123;
}
.window-controls button:disabled {
  opacity: 0.35;
}
.window-controls button:focus-visible {
  outline: 1px dotted currentColor;
  outline-offset: -4px;
}
.mdl {
  font: 10px/1 'SEGOEUIMDL';
}
.win10-app-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>
<style>
.wintmp_outer:has(> .wintmp_main > .win10-app-frame) {
  overflow: clip;
}
.wintmp_outer.max:has(> .wintmp_main > .win10-app-frame) > .win_drag_border,
.wintmp_outer.fullscreen:has(> .wintmp_main > .win10-app-frame) > .win_drag_border {
  display: none;
}
</style>
