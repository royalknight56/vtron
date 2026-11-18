<template>
  <div class="startmenu" :class="{ compact: !showTiles }" @click="handleClick">
    <StartOption />
    <MenuList />
    <Magnet v-if="showTiles" />
  </div>
</template>
<script lang="ts" setup>
import { System } from '@packages/kernel';
import Magnet from './components/Magnet.vue';
import MenuList from './components/MenuList.vue';
import StartOption from './components/StartOption.vue';
import { computed, inject } from 'vue';
const sys = inject<System>('system')!;
const showTiles = computed(() => sys.getConfig('desktopPreferences')?.showStartTiles !== false);
function handleClick(e: MouseEvent) {
  sys.emitEvent('startMenu.click', e);
}
</script>
<style scoped>
.startmenu {
  --rail-width: 48px;
  --start-hover: rgb(0 0 0 / 7%);
  width: min(648px, 100%);
  height: min(640px, calc(100dvh - var(--task-bar-height) - 8px));
  display: grid;
  grid-template-columns: var(--rail-width) minmax(0, 0.84fr) minmax(0, 1fr);
  overflow: hidden;
  z-index: 40;
  color: #181818;
  background: var(--color-startmenu-opacity);
  backdrop-filter: blur(28px) saturate(125%);
  box-shadow: 0 4px 18px rgb(0 0 0 / 23%);
  font:
    14px/1.4 'Segoe UI',
    'Microsoft YaHei UI',
    'Microsoft YaHei',
    sans-serif;
  text-align: left;
  user-select: none;
}
.startmenu.compact {
  width: min(312px, 100%);
  grid-template-columns: var(--rail-width) minmax(0, 1fr);
}
.startmenu :deep(button) {
  font: inherit;
  color: inherit;
  border: 0;
  border-radius: 0;
  background: transparent;
}
.startmenu :deep(button:focus-visible) {
  outline: 2px solid #0067b8;
  outline-offset: -2px;
}
.startmenu :deep(.start-scroll) {
  min-width: 0;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
.startmenu :deep(.start-scroll:hover),
.startmenu :deep(.start-scroll:focus-within) {
  scrollbar-color: #888 transparent;
}
</style>
