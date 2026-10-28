<template>
  <header
    v-dragable
    class="office-titlebar"
    @mousedown.capture="win?.moveTop()"
    @touchstart.capture.passive="win?.moveTop()"
    @mousedown.stop
    @touchstart.stop.passive
    @dblclick="toggleMaximize"
  >
    <div
      class="office-titlebar-content"
      @mousedown="stopControlDrag"
      @touchstart.passive="stopControlDrag"
      @dblclick="stopControlDrag"
    >
      <slot />
    </div>
    <div class="office-window-controls" @mousedown.stop @touchstart.stop.passive @dblclick.stop>
      <button
        type="button"
        class="office-window-button"
        aria-label="最小化窗口"
        title="最小化"
        @click="win?.minimize()"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5h10" /></svg>
      </button>
      <button
        type="button"
        class="office-window-button"
        :aria-label="maximized ? '还原窗口' : '最大化窗口'"
        :title="maximized ? '还原' : '最大化'"
        @click="toggleMaximize"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path v-if="maximized" d="M5.5 5.5v-3h8v8h-3m-8-5h8v8h-8Z" />
          <path v-else d="M3.5 3.5h9v9h-9Z" />
        </svg>
      </button>
      <button
        type="button"
        class="office-window-button office-window-close"
        aria-label="关闭窗口"
        title="关闭"
        @click="$emit('close')"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 3.5 9 9m0-9-9 9" /></svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { BrowserWindow, vDragable } from 'vtron';

defineEmits<{ (event: 'close'): void }>();
const win = inject<BrowserWindow>('browserWindow');
const maximized = computed(() => win?.isMaximized() ?? false);

function toggleMaximize() {
  if (maximized.value) win?.unmaximize();
  else win?.maximize();
}

function stopControlDrag(event: Event) {
  if (
    event.target instanceof Element &&
    event.target.closest('button, input, select, textarea, a, [contenteditable]')
  )
    event.stopPropagation();
}
</script>

<style>
.office-window {
  border-radius: inherit;
  outline: 1px solid rgb(0 0 0 / 16%);
  outline-offset: -1px;
}
.wintmp_outer.max:has(> .wintmp_main > .office-window),
.wintmp_outer.fullscreen:has(> .wintmp_main > .office-window) {
  border-radius: 0 !important;
  box-shadow: none !important;
}
.wintmp_outer.max > .wintmp_main > .office-window,
.wintmp_outer.fullscreen > .wintmp_main > .office-window {
  border-radius: 0;
  outline: none;
}
.wintmp_outer.max:has(> .wintmp_main > .office-window) > .win_drag_border {
  display: none;
}
.office-titlebar {
  user-select: none;
  touch-action: none;
}
.office-titlebar-content {
  display: flex;
  align-items: center;
  gap: inherit;
  flex: 1;
  min-width: 0;
  height: 100%;
}
.office-titlebar-content > :is(button, input) {
  touch-action: manipulation;
}
.office-window-controls {
  display: flex;
  align-self: stretch;
  flex-shrink: 0;
  margin-left: 8px;
}
.office-window-controls .office-window-button {
  display: grid;
  place-items: center;
  width: 44px;
  min-width: 36px;
  height: 100%;
  min-height: 0;
  border: 0;
  border-radius: 0;
  padding: 0;
  background: transparent;
  color: #fff;
  cursor: default;
}
.office-window-controls .office-window-button svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1;
  pointer-events: none;
}
.office-window-controls .office-window-button:hover {
  background: rgb(255 255 255 / 16%);
}
.office-window-controls .office-window-button:active {
  background: rgb(255 255 255 / 26%);
}
.office-window-controls .office-window-close:hover,
.office-window-controls .office-window-close:active {
  background: #c42b1c;
  color: #fff;
}
.office-window-controls .office-window-button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: -4px;
}
@media (max-width: 600px) {
  .office-window-controls .office-window-button {
    width: 36px;
  }
}
</style>
