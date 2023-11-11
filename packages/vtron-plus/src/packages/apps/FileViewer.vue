<template>
  <div class="txt">
    <div class="txt-upper">
      <div class="txt-button" @click="handleButton">文件(F)</div>
    </div>
    <div class="txt-content">
      <textarea class="txt-input" v-model="input"> </textarea>
    </div>
  </div>
</template>
<script setup lang="ts">
import { BrowserWindow, Notify, System } from "vtron";
import { inject, ref } from "vue";

const browserWindow: BrowserWindow | undefined = inject("browserWindow");

const base64String = browserWindow?.config.content;
const binaryData = base64String;

const input = ref("");
input.value = binaryData;

const system = inject<System>("system");
function handleButton(e: MouseEvent) {
  system?.emitEvent("contextMenu.show", {
    mouse: e,
    menuList: [
      {
        name: "保存",
        click: async () => {
          const file = await system.fs.stat(browserWindow?.config.path);
          if (!file) {
            new Notify({
              title: "提示",
              content: "文件不存在",
            });
            return;
          }
          await system.fs.unlink(file?.path);
          await system.fs.writeFile(file?.path, input.value);
          new Notify({
            title: "提示",
            content: "文件保存成功",
          });
        },
      },
    ],
  });
}
</script>
<style scoped>
.txt {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
}

.txt-upper {
  width: 100%;
  height: 20px;
  color: #444;
  background-color: #ffffff;
  user-select: none;
}

.txt-button {
  width: 50px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  text-align: center;
  background-color: #ffffff;
}

.txt-button:hover {
  background-color: #9ae7ff76;
}

.txt-content {
  width: 100%;
  height: calc(100% - 20px);
  background-color: #ffffff;
}

.txt-input {
  display: block;
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  border: none;
  outline: none;
  resize: none;
}
</style>
