<template>
  <div class="appicon-group">
    <AppIcon v-for="entry in entries" :key="entry.key" :app="entry.app" :windows="entry.windows" />
  </div>
</template>
<script lang="ts" setup>
import { computed, inject } from 'vue';
import type { System } from '@packages/kernel';
import type { WinAppOptionsApp } from '@/packages/type/type';
import { launcherForWindow, type TaskWindow } from '../../../utils/taskbarPins';
import AppIcon from './AppIcon.vue';

const sys = inject<System>('system')!;
const apps = computed(() => sys.stateManager.windowMap.launchers);
type Entry = { key: string; app?: WinAppOptionsApp; windows: TaskWindow[] };
const entries = computed(() => {
  const buttons = new Map<string, Entry>();
  for (const id of sys.getConfig('desktopPreferences')?.pinnedTaskbarApps ?? []) {
    const app = apps.value.get(id);
    if (app) buttons.set(id, { key: id, app, windows: [] });
  }
  for (const win of sys.stateManager.windowTree.windowOrder) {
    if (!win.windowInfo.isCreated || win.windowInfo.skipTaskbar) continue;
    const app = launcherForWindow(apps.value, win);
    const pinned = app?.window.appId && buttons.get(app.window.appId);
    if (pinned) pinned.windows.push(win);
    else {
      const key = 'window:' + win.id;
      buttons.set(key, { key, app, windows: [win] });
    }
  }
  return [...buttons.values()];
});
</script>
<style lang="scss" scoped>
.appicon-group {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  flex-grow: 1;
  overflow-x: auto;
  min-width: 0;
  scrollbar-width: none;
  z-index: 41;
  background-color: inherit;

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
