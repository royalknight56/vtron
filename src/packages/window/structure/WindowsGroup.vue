<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 16:36:32
 * @Description: 
 * @FilePath: /myindex/src/components/window/WindowsGroup.vue
  Need CodeReview 
-->
<template>
    <div class="winitem" v-for="item in windowInfoMap" :key="item.id">
        <teleport to="#win10id">
            <WindowTmpVue :system="system" :id="item.id" :ref="'ref' + item.id"></WindowTmpVue>
        </teleport>
    </div>
</template>
<script setup lang="ts">
import WindowTmpVue from "@libs/WindowTmp.vue";
import { PrivateDWM } from "@/packages/window/libs/DWM/index"
import {windowInfoMap} from "@state/index";

import {System} from '@libs/System'
defineProps({
  system:{
    type:System,
    required:true
  }
})

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