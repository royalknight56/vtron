<template>
  <div class="vtron-excel-viewer" ref="viewer">
    <vue-office-excel :src="base64PDFToBlobUrl()" />
  </div>
</template>
<script setup lang="ts">
import { BrowserWindow } from 'vtron';
import { inject, ref, watch } from 'vue';
// @ts-ignore
import VueOfficeExcel from '@vue-office/excel/lib/v3/vue-office-excel.mjs';

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
<style lang="scss">
.vtron-excel-viewer {
  // 省略扩展名，让 Sass 内联第三方 CSS，并加上应用容器前缀。
  @import '@vue-office/excel/lib/v3/index';
}
</style>
<style scoped>
.vtron-excel-viewer {
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
