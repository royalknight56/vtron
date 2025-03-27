<template>
  <div class="viewer">
    <vue-office-docx :src="base64PDFToBlobUrl(browserWindow?.config.content)" />
  </div>
</template>
<script setup lang="ts">
import { BrowserWindow } from 'vtron';
import { inject } from 'vue';
// @ts-ignore
import VueOfficeDocx from '@vue-office/docx/lib/v3/vue-office-docx.mjs';

import '@vue-office/docx/lib/v3/index.css';

const browserWindow: BrowserWindow | undefined = inject('browserWindow');

function base64PDFToBlobUrl(base64: string) {
  return 'data:application/octet-stream;base64,' + base64;
}
</script>
<style scoped>
.viewer {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
}
.viewer-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.max-full {
  width: 100%;
  height: 100%;
}
</style>
