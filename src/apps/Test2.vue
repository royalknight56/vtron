<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-18 10:20:16
 * @Description: 
 * @FilePath: /myindex/src/apps/Test2.vue
-->
<template>
    <div class="t2">
        版本：
        mywin 0.01
        <img width="20" :src="winimg">
    </div>
</template>
<script lang="ts" setup>
import winimg from "../assets/win.png"
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