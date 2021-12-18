<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-12-16 19:56:29
 * @Description: 
 * @FilePath: /myindex/src/components/window/WindowsGroup.vue
  Need CodeReview 
-->
<template>
    <div
        class="winitem"
        v-for="item in winlist"
        :key="item.id"
        >
        <teleport to="body">
            <WindowTmpVue :id='item.id' :ref="'ref'+item.id" :ctx="item"></WindowTmpVue>
        </teleport>
        </div>
</template>
<script setup lang="ts">
import WindowTmpVue from "../libs/WindowTmp.vue";
import { DWM } from "../libs/DWM"

// {title:title,width,height,ctx:ctx}

let winlist = DWM.getInstance().windowInfoMap

</script>