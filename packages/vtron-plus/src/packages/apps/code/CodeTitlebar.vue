<template>
  <header ref="host" v-dragable class="vc-titlebar" @mousedown.capture="win?.moveTop()" @touchstart.capture.passive="win?.moveTop()" @mousedown.stop @touchstart.stop.passive @dblclick="emit('maximize')" @keydown.esc="menu = ''">
    <img :src="vscodeIcon" class="vc-logo" alt="" />
    <nav class="vc-menu" aria-label="应用菜单" @mousedown.stop @touchstart.stop.passive @dblclick.stop>
      <div v-for="group in menus" :key="group.name" class="vc-menu-group">
        <button :class="{ selected: menu === group.name }" aria-haspopup="menu" :aria-expanded="menu === group.name" @click.stop="menu = menu === group.name ? '' : group.name">{{ group.name }}</button>
        <div v-if="menu === group.name" class="vc-menu-popup" role="menu">
          <button v-for="item in group.items" :key="item.label" role="menuitem" @click="runItem(item.run)"><span>{{ item.label }}</span><kbd v-if="item.key">{{ item.key }}</kbd></button>
        </div>
      </div>
    </nav>
    <button class="vc-command" title="快速打开文件 (Ctrl+P)" @mousedown.stop @touchstart.stop.passive @dblclick.stop @click.stop="emit('quickOpen')"><CodeIcon name="search" /><span>{{ folderName }} — VS Code</span></button>
    <span class="vc-title-spacer"></span>
    <div class="vc-window-controls" @mousedown.stop @touchstart.stop.passive @dblclick.stop>
      <button title="最小化" aria-label="最小化 VS Code" @click="emit('minimize')"><svg viewBox="0 0 16 16"><path d="M3 8h10" /></svg></button>
      <button :title="maximized ? '还原' : '最大化'" :aria-label="maximized ? '还原 VS Code' : '最大化 VS Code'" @click="emit('maximize')"><svg viewBox="0 0 16 16"><path v-if="maximized" d="M5.5 5.5v-3h8v8h-3m-8-5h8v8h-8Z" /><path v-else d="M3.5 3.5h9v9h-9Z" /></svg></button>
      <button class="vc-close-window" title="关闭" aria-label="关闭 VS Code" @click="emit('close')"><svg viewBox="0 0 16 16"><path d="m3.5 3.5 9 9m0-9-9 9" /></svg></button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref } from 'vue';
import { vDragable, type BrowserWindow } from 'vtron';
import CodeIcon from './CodeIcon.vue';
import vscodeIcon from '../../assets/vscode.svg';

defineProps<{
  folderName: string;
  menus: { name: string; items: { label: string; key: string; run: () => unknown }[] }[];
  maximized: boolean;
}>();
const emit = defineEmits<{
  (event: 'quickOpen'): void;
  (event: 'minimize'): void;
  (event: 'maximize'): void;
  (event: 'close'): void;
}>();
const win = inject<BrowserWindow>('browserWindow');
const host = ref<HTMLElement>();
const menu = ref('');

function runItem(run: () => unknown) {
  menu.value = '';
  run();
}
function closeOutside(event: PointerEvent) {
  if (!(event.target instanceof Node) || !host.value?.contains(event.target)) menu.value = '';
}
onMounted(() => document.addEventListener('pointerdown', closeOutside, true));
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOutside, true));
</script>

<style scoped>
.vc-titlebar { height: 36px; flex-shrink: 0; display: flex; align-items: center; background: var(--title); color: var(--fg); user-select: none; touch-action: none; }
.vc-titlebar * { box-sizing: border-box; }
button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0; border: 0; color: inherit; background: transparent; cursor: pointer; font: inherit; }
button:hover, button.selected { background: var(--hover); }
button:focus-visible { outline: 1px solid #007fd4; outline-offset: -1px; }
.vc-logo { width: 18px; height: 18px; margin: 0 12px; }
.vc-menu { display: flex; height: 100%; align-items: center; flex-shrink: 0; }
.vc-menu-group { position: relative; height: 100%; }
.vc-menu-group > button { height: 100%; padding: 0 9px; font-size: 12px; }
.vc-menu-popup { position: absolute; top: 35px; left: 0; z-index: 40; width: 260px; padding: 5px; background: var(--sidebar); border: 1px solid var(--border); border-radius: 4px; box-shadow: 0 4px 18px #0006; }
.vc-menu-popup button { width: 100%; justify-content: space-between; padding: 7px 10px; font-size: 12px; border-radius: 2px; }
kbd { color: var(--muted); font: inherit; font-size: 11px; white-space: nowrap; }
.vc-command { margin: 0 auto; width: min(38%, 420px); height: 25px; background: #ffffff0d; border: 1px solid #8885; border-radius: 5px; font-size: 12px; color: var(--fg); }
.vc-command svg { width: 13px; height: 13px; }
.vc-command span { white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.vc-title-spacer { width: 12px; }
.vc-window-controls { display: flex; height: 100%; flex-shrink: 0; }
.vc-window-controls button { width: 44px; height: 100%; cursor: default; }
.vc-window-controls svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1; }
.vc-window-controls .vc-close-window:hover { background: #e81123; color: white; }
@media (max-width: 700px) { .vc-command { display: none; }.vc-title-spacer { flex: 1; } }
</style>
