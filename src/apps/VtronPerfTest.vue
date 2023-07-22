<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 16:45:53
 * @Description: 
 * @FilePath: /myindex/src/components/apps/Test3.vue
-->
<template>
  <div class="outer">
    Test Finished
    {{ sys?.version }}
  </div>
</template>
<script lang="ts" setup>
import { Notify } from '@feature/notification/Notification';
import { BrowserWindow, useSystem } from '@packages/plug';
import { ref, useAttrs, getCurrentInstance, onUnmounted, inject } from 'vue';
import TestButton from './TestButton.vue';

let browserWindow: BrowserWindow = inject('browserWindow')!;
let sys = useSystem();
function nextStep(fun: Function, time?: number) {
  return new Promise((resolve, reject) => {
    let res = fun();
    setTimeout(() => {
      resolve(res);
    }, time || 50);
  });
}
await nextStep(() => {
  let [x, y] = browserWindow.getPosition();
  let [width, height] = browserWindow.getSize();
  new Notify({
    title: 'title',
    content: `${x},${y},${width},${height}`,
    timeout: 5000,
  });
}, 100);

let timer: any;
let timer2: any;

await nextStep(() => {
  timer = setInterval(() => {
    new Notify({
      title: 'title' + Math.random(),
      content: 'content' + Math.random(),
      timeout: 5000 * Math.random(),
    });
  }, 10);
}, 1000);
let winarr: any = [];
await nextStep(() => {
  timer2 = setInterval(() => {
    let win = new BrowserWindow({
      content: TestButton,
      title: '测试无边框拖动',
      center: true,
    });
    win.show();
    winarr.push(win);
  }, 10);
}, 3000);
await nextStep(() => {
  clearInterval(timer2);
}, 100);
await nextStep(() => {
  winarr.forEach((win: BrowserWindow) => {
    win.close();
  });
}, 100);

await nextStep(() => {
  clearInterval(timer);
  clearInterval(timer2);
}, 100);

onUnmounted(() => {
  clearInterval(timer);
  clearInterval(timer2);
});
</script>
<style scoped>
.outer {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: greenyellow;
  font-size: 30px;
}
</style>
