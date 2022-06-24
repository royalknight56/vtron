<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-06-24 15:05:30
 * @Description: 
 * @FilePath: /myindex/src/components/window/WindowsGroup.vue
  Need CodeReview 
-->
<template>
    <div class="winitem" v-for="item in windowInfoMap" :key="item.id">
        <teleport to="#win10id">
            <WindowTmpVue :id="item.id" :ref="'ref' + item.id"></WindowTmpVue>
        </teleport>
    </div>
</template>
<script setup lang="ts">
import WindowTmpVue from "@libs/WindowTmp.vue";
import { PrivateDWM } from "@/packages/window/libs/DWM/index"
import {windowInfoMap} from "@state/index";

// {title:title,width,height,ctx:ctx}

// let winlist = windowInfoMap

</script>
<style scoped>
@import '../../main.css';
.winitem {
    position: relative;
    z-index: 2;

}
</style>