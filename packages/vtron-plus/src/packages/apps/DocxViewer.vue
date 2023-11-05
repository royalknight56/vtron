<template>
  <div class="viewer">
    <vue-office-docx :src="base64PDFToBlobUrl(browserWindow?.config.content)" />
  </div>
</template>
<script setup lang="ts">
import { BrowserWindow } from "vtron";
import { inject, watch } from "vue";
// @ts-ignore
import VueOfficeDocx from "@vue-office/docx/lib/v3/vue-office-docx.mjs";

import "@vue-office/docx/lib/index.css";

let browserWindow: BrowserWindow | undefined = inject("browserWindow");

function base64PDFToBlobUrl(base64: string) {
  return browserWindow?.config.content;
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
