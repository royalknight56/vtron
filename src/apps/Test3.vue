<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 16:45:53
 * @Description: 
 * @FilePath: /myindex/src/components/apps/Test3.vue
-->
<template>
    <div class="outer">
        <div class="uper">
            <input class="urlinput" v-model="urlinput" @keydown="urlkey"/>
            <button class="change button" @click="changeUrl">-</button>
        </div>
        
        <!-- <iframe class="broifame" :src="urlsrc"></iframe> -->
    </div>
</template>
<script lang="ts" setup>
import { ref,useAttrs,getCurrentInstance } from "vue";
// import { DragWindow } from "../packages/window/libs/DragWindow";


import icon from "../assets/浏览器.png"
import TestLoadafterVue from "./TestLoadafter.vue";
// let system = new System();
// system.Power.closePower();
// setTimeout(()=>{
// system.Power.openPower()

// },4000)
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
// } 
// let after = system.DragWindow({
//     title:'test',
//     icon,
//     content:TestLoadafterVue})
// setTimeout(()=>{
//     after.show()
// },1000)
// setTimeout(()=>{
//     // after.hide()
//     after.center()
// },2000)

// setTimeout(()=>{
//     after.setPosition(0,0)
// },3000)
// setTimeout(()=>{
//     console.log(after.isNormal())
//     console.log(after.getPosition())
// },4000)
// setTimeout(()=>{
//     after.destroy()
// },10000)

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