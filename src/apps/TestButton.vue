<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 15:12:43
 * @Description: 
-->
<template>
    <div class="outer">
        <button @click="test()">Test</button>
        <div class="screen">TEST</div>
        <div class="testright"></div>
    </div>
</template>
<script lang="ts" setup>
import { Dialog } from "@/packages/feature/dialog/Dialog";
import { Notify } from "@/packages/plug";
// import { system } from "../systeminit";
async function test(){
    let res = await Dialog.showMessageBox({
        type: 'info',
        title: 'title',
        message: '无法将文件移动到“C:',
    });

    new Notify({
        title: 'title',
        content: JSON.stringify(res),
        timeout: 5000
    });

    // console.log('test') 
    // system.Notify.notify('test',"testtest")
}
</script>
<style>

</style>
<style scoped>
.screen{
    position: fixed;
    bottom: 0;
    right: 0i
}
.testright{
    position: absolute;
    right: 0;
    bottom: 0;
    width: 100px;
    height: 100px;
    background-color: red;
}
</style>