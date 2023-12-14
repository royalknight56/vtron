<template>
  <video class="viewer" controls>
    <source :src="content" type="video/mp4" />
  </video>
</template>
<script setup lang="ts">
import { BrowserWindow } from 'vtron';
import { inject } from 'vue';

const window: BrowserWindow | undefined = inject('browserWindow');

const content = base64ToBlobUrl(window?.config.content.replace(/^data:(.)*;base64,/, ''));

function base64ToBlobUrl(base64: string) {
  const binStr = atob(base64);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  const blob = new Blob([arr], { type: 'video/mp4' });

  const url = URL.createObjectURL(blob);
  return url;
}
</script>
<style scoped>
.viewer {
  width: 100%;
  height: 100%;
  margin: 0 auto;
}
</style>
