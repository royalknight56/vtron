<template>
  <div class="viewer">
    <div class="loading" v-if="!content">
      Loading
      <WinLoadingVue></WinLoadingVue>
    </div>
    <img class="viewer-img" v-else :src="content" />
  </div>
</template>
<script setup lang="ts">
import { inject, onMounted, ref } from "vue";

import { BrowserWindow, System, VtronFileSystem, WinLoadingVue } from "vtron";

const browserWindow: BrowserWindow | undefined = inject("browserWindow");
const sys = inject<System>("system")!;
const content = ref("");

onMounted(() => {
  const path = browserWindow?.config.content;

  if (sys.fs instanceof VtronFileSystem) {
    sys.fs.checkVolumePath(path);
  }
  if (path?.startsWith("http")) {
    // http://admin:admin@example.com:5244/dav/a.jpg to admin:admin
    const url = new URL(path);
    const cred = url.password ? `${url.username}:${url.password}` : "";
    if (cred) {
      const resource = url.href.replace(`${url.username}:${url.password}@`, "");
      const headers = new Headers({
        Authorization: `Basic ${btoa(cred)}`,
      });
      fetch(resource, {
        headers: headers,
      }).then((res) => {
        res.blob().then((blob) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onload = function (e) {
            content.value = e.target?.result as string;
          };
        });
      });
      return;
    } else {
      content.value = path;
    }
  } else {
    content.value = path;
    return;
  }
});
</script>
<style scoped>
.viewer {
  width: 100%;
  height: 100%;
  background-color: #000;
}
.loading {
  width: 100%;
  height: 100%;
}
.viewer-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
