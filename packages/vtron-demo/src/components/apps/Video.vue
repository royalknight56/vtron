<template>
  <video class="viewer" controls>
    <source :src="content" type="video/mp4" />
  </video>
</template>
<script setup lang="ts">
import { BrowserWindow, basename } from "vtron";
import { inject } from "vue";

let window: BrowserWindow | undefined = inject("browserWindow");

let content = window?.config.content;

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
  margin: 0 auto;
}
</style>
