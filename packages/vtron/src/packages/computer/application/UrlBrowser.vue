<template>
  <div class="viewer">
    <iframe class="viewer-img" :src="urlsrc"></iframe>
  </div>
</template>
<script setup lang="ts">
import { BrowserWindow } from '@packages/plug';
import { inject } from 'vue';

const window: BrowserWindow | undefined = inject('browserWindow');

// content: `link::url::${options.name}::${options.icon}`
const urlsrc = window?.config.content.split('::')[2];
</script>
<style scoped>
.viewer {
  width: 100%;
  height: 100%;
  background-color: #00000000;
}

.viewer-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border: none;
}
</style>
