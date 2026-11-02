<template>
  <Win10Frame
    :title="definition.title"
    :icon="win?.windowInfo.icon"
    :compact="app === 'diskCleanup'"
    background="#f0f0f0"
    titlebar-background="#fff"
  >
    <div class="win-management" :class="`management-${app}`">
      <ControlPanel v-if="app === 'controlPanel'" />
      <DiskCleanup v-else-if="app === 'diskCleanup'" />
      <ResourceMonitor v-else-if="app === 'resourceMonitor'" />
      <ClassicConsole v-else :app="app" />
    </div>
  </Win10Frame>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { BrowserWindow } from 'vtron';
import Win10Frame from '../../daily/Win10Frame.vue';
import ClassicConsole from './ClassicConsole.vue';
import ControlPanel from './ControlPanel.vue';
import DiskCleanup from './DiskCleanup.vue';
import ResourceMonitor from './ResourceMonitor.vue';
import { isManagementApp, managementApps, type ManagementApp } from './managementApps';

const win = inject<BrowserWindow>('browserWindow');
const app = computed<ManagementApp>(() => {
  const configured = win?.config?.app;
  return isManagementApp(configured) ? configured : 'controlPanel';
});
const definition = computed(() => managementApps[app.value]);
</script>

<style src="./management.css"></style>
