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
import { BrowserWindow, Notify, System } from '@packages/plug';
import { onUnmounted, inject } from 'vue';
import TestButton from './TestButton.vue';

const browserWindow = inject<BrowserWindow>('browserWindow');
if (!browserWindow) throw new Error('browserWindow is null');
const sys = inject<System>('system');
function nextStep(fun: () => void, time?: number) {
  return new Promise((resolve) => {
    const res = fun();
    setTimeout(() => {
      resolve(res);
    }, time || 50);
  });
}
await nextStep(() => {
  const [x, y] = browserWindow.getPosition();
  const [width, height] = browserWindow.getSize();
  new Notify({
    title: 'title',
    content: `${x},${y},${width},${height}`,
    timeout: 5000,
  });
}, 100);

let timer: number;
let timer2: number;

await nextStep(() => {
  timer = window.setInterval(() => {
    new Notify({
      title: 'title' + Math.random(),
      content: 'content' + Math.random(),
      timeout: 5000 * Math.random(),
    });
  }, 10);
}, 1000);
const winarr: BrowserWindow[] = [];
await nextStep(() => {
  timer2 = window.setInterval(() => {
    const win = new BrowserWindow({
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
