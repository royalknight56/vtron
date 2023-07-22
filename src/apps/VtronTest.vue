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
import { onUnmounted, inject } from 'vue';

const browserWindow: BrowserWindow = inject('browserWindow') as BrowserWindow;
const sys = useSystem();
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
await nextStep(() => {
  browserWindow.setPosition(100, 100);
  browserWindow.setSize(500, 500);
}, 100);
await nextStep(() => {
  const [x, y] = browserWindow.getPosition();
  const [width, height] = browserWindow.getSize();
  new Notify({
    title: 'title',
    content: `${x},${y},${width},${height}`,
    timeout: 5000,
  });
}, 100);
await nextStep(() => {
  browserWindow.center();
}, 100);
await nextStep(() => {
  const title = browserWindow.getTitle();
  new Notify({
    title: 'title',
    content: `${title}`,
    timeout: 5000,
  });
}, 100);
await nextStep(() => {
  browserWindow.setTitle('新标题');
  const title = browserWindow.getTitle();
  new Notify({
    title: 'title',
    content: `${title}`,
    timeout: 5000,
  });
}, 100);
await nextStep(() => {
  browserWindow.maximize();
}, 200);
await nextStep(() => {
  browserWindow.restore();
}, 100);
await nextStep(() => {
  browserWindow.minimize();
}, 200);
await nextStep(() => {
  browserWindow.restore();
}, 100);

await nextStep(() => {
  browserWindow.setFullScreen(true);
}, 100);
await nextStep(() => {
  browserWindow.setFullScreen(false);
}, 100);
// await nextStep(() => {
//     props.window.restore();
// },100)
let timer: number;
await nextStep(() => {
  timer = window.setInterval(() => {
    new Notify({
      title: 'title' + Math.random(),
      content: 'content' + Math.random(),
      timeout: 5000 * Math.random(),
    });
  }, 100);
}, 1000);

await nextStep(() => {
  clearInterval(timer);
}, 100);

onUnmounted(() => {
  clearInterval(timer);
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
