<!--
 * @Author: Royal
 * @LastEditTime: 2022-03-08 19:44:41
 * @Description: 
-->
<template>
    <div class="outer">
        <button @click="test()">Test</button>
        <div class="testdiv">TEST</div>
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
.testdiv{
    position: fixed;
    bottom: 0;
    right: 0i
}
</style>