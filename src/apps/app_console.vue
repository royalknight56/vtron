<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-09 19:04:11
 * @Description: 
 * @FilePath: /myindex/src/apps/app_console.vue
-->
<template>
    <div class="consoleline" ref="inputref" @keydown="onkeydown">
        <div class="oneline">
            <span class="selfarea">Hugesoft [version 0.00.10000.100]</span>
        </div>
        <div class="oneline">
            <span class="selfarea">(c) 2021 Hugesoft .Inc All rights reserved</span>
        </div>
        <div class="oneline">
            <span class="selfarea"> &nbsp;</span>
        </div>
        <div class="oneline" v-for="(item,index) in linelist">
            <span class="selfarea leftarea">C:\User\Administrator></span>
            <textarea maxlength="50" v-if="index==linelist.length-1" v-model="inputvalue" class="t2" spellcheck="false"></textarea>
            <span v-else class="selfarea rightarea">{{item.text}}</span>
            <!-- <textarea readonly v-else class="t2" spellcheck="false" :value="item.text"></textarea> -->
            
        </div>
    </div>
</template>
<script lang="ts" setup>import { reactive, ref } from "@vue/reactivity";
import { nextTick, onMounted } from "@vue/runtime-core";
import {consoleIPC} from "../components/window/libs/consoleIPC"
//Hugesoft [version 0.00.10000.100\n(c) 2021 Hugesoft .Inc All rights reserved\n\n
let inputvalue = ref('')
let text = ref({text:''})
let linelist: Array<{text:string}> = consoleIPC.getInstance().linelist
// linelist.push({text:''})
function onkeydown(e: KeyboardEvent) {
    if (e.code == 'Enter') {
        consoleIPC.getInstance().input(inputvalue.value)
        // linelist[linelist.length-1].text=inputvalue.value;
        // linelist.push({text:""});
        inputvalue.value=""
        e.preventDefault();

        nextTick(() => {
            ((inputref.value as HTMLElement).lastElementChild?.lastElementChild as HTMLInputElement).focus();
        })

    }
}

let inputref = ref();
onMounted(() => {
    consoleIPC.getInstance().openConsole()
})
</script>
<style scoped>
.consoleline {
    position: absolute;
    left: 0;
    top: 0;
    background-color: rgb(44, 44, 44);
    height: 100%;
    width: 100%;
    color: rgb(231, 231, 231);
    font-family: monospace;
    font-size: 10px;
    overflow: auto;
}
textarea{
    height: min-content;
    font-size: 13.33333px;
    font-family:Arial, Helvetica, sans-serif;
}
span{
    /* font-family: monospace; */
}
.oneline {
    display: flex;
}
.leftarea{
    flex-grow: 0;
}
.rightarea{
    width:250px
}
.selfarea {
    -webkit-writing-mode: horizontal-tb !important;
    text-rendering: auto;
    color: -internal-light-dark(black, white);
    /* letter-spacing: normal; */
    /* word-spacing: normal; */
    text-transform: none;
    text-indent: 0px;
    text-shadow: none;
    /* display: inline-block; */
    text-align: start;
    /* appearance: auto; */
    background-color: -internal-light-dark(rgb(255, 255, 255), rgb(59, 59, 59));
    -webkit-rtl-ordering: logical;
    flex-direction: column;
    /* resize: auto; */
    cursor: text;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    /* column-count: initial !important; */
    margin: 0em;
    font: 400 13.3333px Arial;

    padding: 2px;
}
.t2 {
    resize:none;
    height:min-content;
    overflow: hidden;
    outline: none;
    border: none;
    background-color: rgba(44, 44, 44, 0);
    width: 100%;
    color: white;
    text-decoration: none;
}
</style>