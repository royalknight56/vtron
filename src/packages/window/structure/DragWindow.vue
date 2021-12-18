<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-17 14:53:24
 * @Description: 可以拖动的窗口
 * @FilePath: /myindex/src/components/window/DragWindow.vue
  Need CodeReview 
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