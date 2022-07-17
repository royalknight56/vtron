<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:34:05
 * @Description: 
 * @FilePath: /myindex/src/components/window/WindowsGroup.vue
  Need CodeReview 
-->
<template>
    <div class="winitem" v-for="item in windowInfoMap" :key="item.id">
        <teleport :to="'#'+system.id">
            <WindowTmpVue :id="item.id" :ref="'ref' + item.id"></WindowTmpVue>
        </teleport>
    </div>
</template>
<script setup lang="ts">
import WindowTmpVue from "@libs/WindowTmp.vue";

import {System} from '@libs/System'
import { inject } from "vue";

let system = <System>inject('system')

let windowInfoMap = system.State.windowInfoMap

</script>
<style scoped>
@import '../../main.css';
.winitem {
    position: relative;
    z-index: 2;

}
</style>