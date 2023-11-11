<template>
  <mavon-editor class="editor" v-model="value" @save="save" />
</template>
<script setup lang="ts">
import editor from "mavon-editor";
import { BrowserWindow, Notify, System, basename } from "vtron";
import { inject, onMounted, ref } from "vue";
const { mavonEditor } = editor;
const value = ref("# hello, markdown!");

const sys = inject<System>("system");
const win = inject<BrowserWindow>("browserWindow");
onMounted(() => {
  if (win?.config?.path) {
    sys?.fs.readFile(win.config.path).then((res) => {
      if (res) {
        value.value = res;
      }
    });
  }
});
async function save(markdown: string, html: string) {
  let path = win?.config?.path;
  const defaultPath = "/C/Users/Desktop/Untitled.md";

  if (!path && (await sys?.fs.exists(defaultPath))) {
    new Notify({
      title: "保存失败",
      content: "文件已存在",
    });
    return;
  }

  if (!path) {
    path = defaultPath;
  }

  sys?.fs.writeFile(path, markdown).then((res) => {
    new Notify({
      title: "保存成功",
      content: "文件已保存到桌面",
    });
  });
}
</script>
<style scoped>
@import "mavon-editor/dist/css/index.css";
.editor {
  height: 100%;
  width: 100%;
}
</style>
