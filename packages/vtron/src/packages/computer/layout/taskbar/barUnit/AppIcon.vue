<template>
  <button
    type="button"
    class="appicon"
    :title="label"
    :aria-label="label"
    :class="{
      running: windows.length,
      'appicon-top': windows.some((win) => win.windowInfo.istop && !win.isMinimized()),
    }"
    @contextmenu.prevent="handleRightClick"
    @click="handleClick"
  >
    <span class="appicon-img"><FileIcon :icon="app?.icon || windows[0]?.windowInfo.icon" /></span>
  </button>
</template>
<script lang="ts" setup>
import { computed, inject } from 'vue';
import type { System } from '@packages/kernel';
import type { WinAppOptionsApp } from '@/packages/type/type';
import FileIcon from '@/packages/computer/application/FileIcon.vue';
import { openRegisteredApp } from '../../../utils/openRegisteredApp';
import { pinAction, type TaskWindow } from '../../../utils/taskbarPins';
import { taskbarWindowActions } from '../../../utils/createTaskbarContextMenu';

const props = defineProps<{ app?: WinAppOptionsApp; windows: TaskWindow[] }>();
const sys = inject<System>('system')!;
const label = computed(() => props.app?.name || props.windows[0]?.windowInfo.title);
function activate(win: TaskWindow) {
  if (win.isMinimized()) win.restore();
  win.moveTop();
}
function handleRightClick(event: MouseEvent) {
  sys.emitEvent('uipop.hidden');
  const win = props.windows.find((item) => item.windowInfo.istop) ?? props.windows[0];
  const items = win ? taskbarWindowActions(win) : [];
  if (props.app?.window.appId) items.unshift(pinAction(sys, props.app.window.appId));
  sys.buildFromTemplate(items).popup(event);
}
function handleClick(event: MouseEvent) {
  sys.emitEvent('uipop.hidden');
  const [win] = props.windows;
  if (!win) openRegisteredApp(sys, props.app);
  else if (props.windows.length > 1) {
    sys
      .buildFromTemplate(
        props.windows.map((item, index) => {
          const title = item.windowInfo.title;
          const repeated = props.windows.some(other => other.id !== item.id && other.windowInfo.title === title);
          return { label: repeated ? title + ' (' + (index + 1) + ')' : title, click: () => activate(item) };
        })
      )
      .popup(event);
  } else if (win.windowInfo.istop && !win.isMinimized()) win.minimize();
  else activate(win);
}
</script>
<style lang="scss" scoped>
.appicon {
  border: 0;
  padding: 0;
  background: transparent;
  flex: 0 0 var(--task-bar-height);
  width: var(--task-bar-height);
  height: var(--task-bar-height);
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  transition: all 0.1s;
  position: relative;
  .appicon-img {
    user-select: none;
    width: 60%;
    height: 60%;
  }
}
.appicon.running::after {
  content: '';
  position: absolute;
  bottom: 0;
  width: 80%;
  height: 4px;
  box-sizing: border-box;
  transition: all 0.1s;
  background-color: #368aca;
}
.appicon-top {
  // background-color: var(--color-gray-active);
  background-color: var(--theme-main-color);
  filter: brightness(110%);
}
.appicon-top::after {
  content: '';
  position: absolute;
  bottom: 0px;
  width: 100%;
  height: 4px;
  box-sizing: border-box;
  transition: all 0.1s;
}
.appicon:hover {
  background-color: var(--color-gray-hover-op);
}
.appicon-top:hover {
  background-color: var(--color-gray-active-op);
}
</style>
