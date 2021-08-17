<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-17 16:50:18
 * @Description: 
 * @FilePath: /myindex/src/components/window/WindowsGroup.vue
-->
<template>
    <div
        class="winitem"
        v-for="item in winlist"
        :key="item.id"
        :ref="'ref'+item.id"
        >
        <teleport to="body">
            <!-- <WindowTmpVue :ref="(el)=>{}" v-bind="{ctx:{IPC:item}}"></WindowTmpVue> -->
        </teleport>
        </div>
</template>
<script setup lang="ts">
import WindowTmpVue from "./libs/WindowTmp.vue";
import { WindowIPC } from "./libs/WindowIPC"

// {title:title,width,height,ctx:ctx}

let winlist = WindowIPC.getInstance().pageMap

</script>