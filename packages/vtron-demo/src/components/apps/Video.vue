<template>
  <video class="viewer" controls>
    <source :src="content" type="video/mp4" />
  </video>
</template>
<script setup lang="ts">
import { BrowserWindow } from 'vtron';
import { inject } from 'vue';

const window: BrowserWindow | undefined = inject('browserWindow');

const content = 'data:application/octet-stream;base64,' + window?.config.content;
</script>
<style scoped>
.viewer {
  width: 100%;
  height: 100%;
  margin: 0 auto;
}
</style>
