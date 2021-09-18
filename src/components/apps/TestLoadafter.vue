<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-18 17:00:42
 * @Description: 
 * @FilePath: /myindex/src/apps/Test3.vue
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