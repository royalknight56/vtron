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
import { Notify } from "@/packages/feature/notification/Notification";
import { BrowserWindow, useSystem } from "@/packages/plug";
import { ref, useAttrs, getCurrentInstance, onUnmounted, inject } from "vue";

let browserWindow:BrowserWindow = inject('browserWindow')!;
let sys = useSystem();
function nextStep(fun: Function,time?:number) {
    return new Promise((resolve, reject) => {
        let res = fun();
        setTimeout(() => {
            resolve(res);
        }, time||50);
    })
}
await nextStep(() => {
    let [x, y] = browserWindow.getPosition();
    let [width, height] = browserWindow.getSize();
    new Notify({
        title: 'title',
        content: `${x},${y},${width},${height}`,
        timeout: 5000
    })
},100)
await nextStep(() => {
    browserWindow.setPosition(100, 100);
    browserWindow.setSize(500, 500);
},100)
await nextStep(() => {
    let [x, y] = browserWindow.getPosition();
    let [width, height] = browserWindow.getSize();
    new Notify({
        title: 'title',
        content: `${x},${y},${width},${height}`,
        timeout: 5000
    })
},100);
await nextStep(() => {
    browserWindow.center();
},100)
await nextStep(() => {
    let title = browserWindow.getTitle();
    new Notify({
        title: 'title',
        content: `${title}`,
        timeout: 5000
    })
},100)
await nextStep(() => {
    browserWindow.setTitle('新标题');
    let title = browserWindow.getTitle();
    new Notify({
        title: 'title',
        content: `${title}`,
        timeout: 5000
    })
},100)
await nextStep(() => {
    browserWindow.maximize();
},200)
await nextStep(() => {
    browserWindow.restore();
},100)
await nextStep(() => {
    browserWindow.minimize();
},200)
await nextStep(() => {
    browserWindow.restore();
},100)

await nextStep(() => {
    browserWindow.setFullScreen(true);
},100)
await nextStep(() => {
    browserWindow.setFullScreen(false);
},100)
// await nextStep(() => {
//     props.window.restore();
// },100)
let timer:any
await nextStep(() => {
    timer = setInterval(() => {
        new Notify({
            title: 'title' + Math.random(),
            content: 'content' + Math.random(),
            timeout: 5000 * Math.random()
        })
    }, 100);
},1000)

await nextStep(() => {
    clearInterval(timer);
},100);

onUnmounted(() => {
    clearInterval(timer);
})
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