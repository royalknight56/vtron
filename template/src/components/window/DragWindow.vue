<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-03 14:44:42
 * @Description: 可以拖动的窗口
 * @FilePath: /myindex/src/components/window/DragWindow.vue
-->
<template>
<div class="windows">
    <div class="outer" v-for="(item,index) in windowslist" :key="index">
        <div class="uper">
            <div class="title">{{ item.title }}</div>
        </div>
    </div>
</div>
</template>
<script lang="ts" setup>
import { PropType } from "@vue/runtime-core";

interface mwindow{
    title:string
};

defineProps({
    windowslist:{
        type:Array as ()=>Array<mwindow>
    },
})
</script>
<style>
</style>