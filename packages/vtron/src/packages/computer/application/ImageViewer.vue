<template>
  <div class="viewer">
    <div class="loading" v-if="!content">
      Loading
      <WinLoading></WinLoading>
    </div>
    <img class="viewer-img" v-else :src="content" />
  </div>
</template>
<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import WinLoading from '@packages/components/WinLoading.vue';
import { BrowserWindow } from '@/packages/services';
import { VtronFileSystem, System } from '@packages/kernel';

const browserWindow: BrowserWindow | undefined = inject('browserWindow');
const sys = inject<System>('system')!;
const content = ref('');

onMounted(() => {
  const fileContent = browserWindow?.config.content;

  if (sys.fs instanceof VtronFileSystem) {
    sys.fs.checkVolumePath(fileContent);
  }
  if (fileContent?.startsWith('http')) {
    // http://admin:admin@example.com:5244/dav/a.jpg to admin:admin
    const url = new URL(fileContent);
    const cred = url.password ? `${url.username}:${url.password}` : '';
    if (cred) {
      const resource = url.href.replace(`${url.username}:${url.password}@`, '');
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
      content.value = fileContent;
    }
  } else {
    content.value = 'data:image/png;base64,' + fileContent;
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
