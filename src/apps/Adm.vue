<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-17 17:13:31
 * @Description: 
 * @FilePath: /myindex/src/apps/Adm.vue
-->
<template>
    <div>
        {{msg}}
        <!-- <button >确定</button> -->
        <el-radio v-model="radio1" label="1">备选项1</el-radio>
        <el-radio v-model="radio1" label="2">备选项2</el-radio><br>
        <el-checkbox v-model="radio2">备选项</el-checkbox><br>
        <el-input-number v-model="radio3" :min="1" :max="10" label="描述文字"></el-input-number><br>
        <el-button @click="submit" type="success">确定</el-button>
    </div>
</template>
<script lang="ts" setup>
import { ref } from "@vue/reactivity";
import { DragWindow } from "../components/window/libs/DragWindow";
import askDialogVue from "./askDialog.vue";
// import ElementPlus from 'element-plus';
import { WindowIPC } from "../components/window/libs/WindowIPC";

let radio1 = ref(1)
let radio2 = ref(1)
let radio3 = ref(1)
let input = ref('')
let bolvalue = ref(true)
let msg = ref('')
WindowIPC.getInstance().on('testEvent',(arg:string)=>{
    msg.value=arg
})
function submit() {
    // new DragWindow(0,0,'确定提交？',300,400,{content:askDialogVue,use:[ElementPlus]})
    new DragWindow(0,0,'确定提交？',300,400,{content:askDialogVue})

}
</script>

<style scoped>
.t2 {
    z-index: 99;
    background-color: blanchedalmond;
}
.t2:hover {
    background-color: rgba(255, 235, 205, 0.747);
}
</style>