<template>
  <div class="viewer">
    <embed
      id="mainpdf"
      :src="content"
      type="application/pdf"
      width="100%"
      height="100%"
    />
  </div>
</template>
<script setup lang="ts">
import { BrowserWindow } from "vtron";
import { inject } from "vue";
let window: BrowserWindow | undefined = inject("browserWindow");

let content = base64PDFToBlobUrl(
  window?.config.content.replace(/^data:application\/octet-stream;base64,/, "")
);
function base64PDFToBlobUrl(base64: string) {
  const binStr = atob(base64);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  const blob = new Blob([arr], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  return url;
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
</style>
