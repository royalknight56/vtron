<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-09-18 17:16:58
 * @Description: 
 * @FilePath: /myindex/src/components/apps/Test3.vue
-->
<template>
    <div class="outer">
        <div class="uper">
            <input class="urlinput" v-model="urlinput" @keydown="urlkey"/>
            <button class="change button" @click="changeUrl">-</button>
        </div>
        
        <iframe class="broifame" :src="urlsrc"></iframe>
    </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { DragWindow } from "../window/libs/DragWindow";
import icon from "../../assets/浏览器.png"
import TestLoadafterVue from "./TestLoadafter.vue";

let urlinput = ref('')
let urlsrc = ref('')
function urlkey(e:KeyboardEvent) {
    if (e.code == 'Enter') {
        changeUrl()
    }
}
function changeUrl() {
    urlsrc.value=urlinput.value
}
window.open=<any>function(e:any) { 
}

let after = new DragWindow(100, 100, "test",icon, 100, 100, {content:TestLoadafterVue})
// setInterval(()=>{
//     after.show()
// })
after.show()
after.onWindowResizing((x,y)=>{ console.log(x,y) })
</script>
<style>
iframe {
    overflow: auto;
    width: 100%;
    height: 100%;
}
</style>
<style scoped>
.outer {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}
.urlinput {
    width: 100%;
}
.tablist{
    box-sizing: border-box;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 12px;
    height: 46px;
    padding: 8px 3px 4px 3px;
    background: #dee1e6;
    border-radius: 5px 5px 0 0;
    overflow: hidden;

    box-sizing: border-box;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 12px;
    height: 46px;
    padding: 8px 3px 4px 3px;
    background: #dee1e6;
    border-radius: 5px 5px 0 0;
    overflow: hidden;
}
.uper{
    display: flex;

    box-sizing: border-box;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 12px;
    height: 46px;
    padding: 8px 3px 4px 3px;
    background: #dee1e6;
    border-radius: 5px 5px 0 0;
    overflow: hidden;
}
.broifame{
    /* height: 100%; */
    width: 100%;
}
</style>