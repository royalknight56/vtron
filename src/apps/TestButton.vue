<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-01-27 14:32:00
 * @Description: 
-->
<template>
    <div class="outer">
        <button @click="test()">Test</button>
    </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { Notify } from "../packages/window/libs/Notify";
function test(){
    // console.log('test') 
    new Notify('test',"testtest")
}
</script>
<style>

</style>
<style scoped>
</style>