<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 16:45:53
 * @Description: 
 * @FilePath: /myindex/src/components/apps/Test3.vue
-->
<template>
    <div class="outer">
        Test Finished
    </div>
</template>
<script lang="ts" setup>
import { Notify } from "@/packages/feature/notification/Notification";
import { BrowserWindow } from "@/packages/plug";
import { ref, useAttrs, getCurrentInstance, onUnmounted } from "vue";

let props = defineProps<{
    window: BrowserWindow
}>()
function nextStep(fun: Function,time?:number) {
    return new Promise((resolve, reject) => {
        let res = fun();
        setTimeout(() => {
            resolve(res);
        }, time||50);
    })
}
await nextStep(() => {
    let [x, y] = props.window.getPosition();
    let [width, height] = props.window.getSize();
    new Notify({
        title: 'title',
        content: `${x},${y},${width},${height}`,
        timeout: 5000
    })
},100)
await nextStep(() => {
    props.window.setPosition(100, 100);
    props.window.setSize(500, 500);
},100)
await nextStep(() => {
    let [x, y] = props.window.getPosition();
    let [width, height] = props.window.getSize();
    new Notify({
        title: 'title',
        content: `${x},${y},${width},${height}`,
        timeout: 5000
    })
},100);
await nextStep(() => {
    props.window.center();
},100)
await nextStep(() => {
    let title = props.window.getTitle();
    new Notify({
        title: 'title',
        content: `${title}`,
        timeout: 5000
    })
},100)
await nextStep(() => {
    props.window.setTitle('新标题');
    let title = props.window.getTitle();
    new Notify({
        title: 'title',
        content: `${title}`,
        timeout: 5000
    })
},100)
await nextStep(() => {
    props.window.maximize();
},200)
await nextStep(() => {
    props.window.restore();
},100)
await nextStep(() => {
    props.window.minimize();
},200)
await nextStep(() => {
    props.window.restore();
},100)

await nextStep(() => {
    props.window.setFullScreen(true);
},100)
await nextStep(() => {
    props.window.setFullScreen(false);
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