<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-03-03 16:06:30
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
<style scoped>
@import "../../main.css";
</style>