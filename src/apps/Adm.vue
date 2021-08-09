<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-09 19:53:22
 * @Description: 
 * @FilePath: /myindex/src/apps/Adm.vue
-->
<template>
    <div>
        <el-radio v-model="radio1" label="1">备选项</el-radio>
        <el-radio v-model="radio1" label="2">备选项</el-radio>
        <br>
        <el-checkbox v-model="radio2" disabled>备选项1</el-checkbox>
        <el-checkbox v-model="radio2" disabled>备选项</el-checkbox>
        <br>
        <el-input v-model="input" placeholder="请输入内容"></el-input>
        <el-input-number v-model="radio3" :min="1" :max="10" label="描述文字"></el-input-number>
        <br>
        <el-switch v-model="bolvalue" active-color="#13ce66" inactive-color="#ff4949"></el-switch>
        <br>
        <el-button type="primary" @click="submit">确定</el-button>
    </div>
</template>
<script lang="ts" setup>
import { ref } from "@vue/reactivity";
import { DragWindow } from "../components/window/libs/DragWindow";
import askDialogVue from "./askDialog.vue";
import ElementPlus from 'element-plus';

let radio1 = ref(1)
let radio2 = ref(1)
let radio3 = ref(1)
let input = ref('')
let bolvalue = ref(true)

function submit() {
    new DragWindow(0,0,'确定提交？',300,400,{content:askDialogVue,use:[ElementPlus]})
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