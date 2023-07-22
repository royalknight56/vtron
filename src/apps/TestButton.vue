<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 15:12:43
 * @Description: 
-->
<template>
  <div class="outer" ref="handle">
    <button @click="test()">Test</button>
    <div class="screen">TEST</div>
    <div class="testright"></div>
  </div>
</template>
<script lang="ts" setup>
import { Dialog } from '@feature/dialog/Dialog';
import { BrowserWindow, Notify, makeDragable } from '@packages/plug';
import { inject, onMounted, ref } from 'vue';
let browserWindow = inject<BrowserWindow>('browserWindow');
const handle = ref<HTMLElement>();
async function test() {
  let res = await Dialog.showMessageBox({
    type: 'info',
    title: 'title',
    message: '无法将文件移动到“C:',
  });

  new Notify({
    title: 'title',
    content: JSON.stringify(res),
    timeout: 5000,
  });
}
onMounted(() => {
  if (handle.value && browserWindow) {
    makeDragable(handle.value, browserWindow);
  }
});
</script>
<style></style>
<style scoped>
.screen {
  position: fixed;
  bottom: 0;
  right: 0i;
}

.testright {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100px;
  height: 100px;
  background-color: red;
}
</style>
