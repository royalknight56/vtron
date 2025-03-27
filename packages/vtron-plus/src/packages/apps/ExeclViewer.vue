<template>
  <div class="viewer" ref="viewer">
    <vue-office-excel :src="base64PDFToBlobUrl()" />
  </div>
</template>
<script setup lang="ts">
import { BrowserWindow } from 'vtron';
import { inject, ref, watch } from 'vue';
// @ts-ignore
import VueOfficeExcel from '@vue-office/excel/lib/v3/vue-office-excel.mjs';
import '@vue-office/excel/lib/v3/index.css';

const browserWindow: BrowserWindow | undefined = inject('browserWindow');

function base64PDFToBlobUrl() {
  return 'data:application/octet-stream;base64,' + browserWindow?.config.content;
}
const viewer = ref<HTMLElement | null>(null);

function resize() {
  window.dispatchEvent(new Event('resize'));
}
watch(
  () => {
    return browserWindow?.windowInfo.width?.toString() || '0' + browserWindow?.windowInfo.height?.toString();
  },
  () => {
    resize();
  }
);
watch(
  () => {
    return browserWindow?.windowInfo.state;
  },
  () => {
    setTimeout(() => {
      resize();
    }, 300);
  }
);
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
