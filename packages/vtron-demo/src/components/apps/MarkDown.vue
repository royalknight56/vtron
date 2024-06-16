<template>
  <mavon-editor class="editor" v-model="value" @save="save" />
</template>
<script setup lang="ts">
import { BrowserWindow, Notify, System } from 'vtron';
import { inject, onMounted, ref } from 'vue';

const value = ref('# hello, markdown!');
const sys = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');
onMounted(() => {
  if (win?.config.path) {
    sys?.fs.readFile(win.config.path).then((res) => {
      if (res) {
        try {
          const base64String = decodeURIComponent(escape(atob(res)));
          value.value = base64String;
        } catch (error) {
          console.log(error);
          value.value = res;
        }
      }
    });
  }
});
function save(markdown: string, html: string) {
  html;
  let path = win?.config?.path;

  if (!path) {
    path = '/C/Users/Desktop/Untitled.md';
  }
  sys?.fs.writeFile(path, btoa(unescape(encodeURIComponent(markdown)))).then(() => {
    new Notify({
      title: '保存成功',
      content: '文件已保存到桌面',
    });
  });
}
</script>
<style scoped>
.editor {
  height: 100%;
  width: 100%;
}
</style>
