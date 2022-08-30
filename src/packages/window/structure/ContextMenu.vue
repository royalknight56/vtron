<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-15 10:53:07
 * @Description: 
 * @FilePath: /myindex/src/components/window/MenuList.vue
  Need CodeReview 
-->
<template>
    <div class="menu_outer" :style="cusStyle" :class="{ defOver: IPC.ifTopDown }">
        <div class="menulist" v-for="item in IPC.menuList" @click="callFunc(item)">{{ item.name }}</div>
    </div>
</template>
<script lang="ts" setup>
import { computed, inject, reactive, ref } from "vue";
import type {menuItem}from "@libs/ContextMenu";

import {System} from '@libs/System'

let system = <System>inject('system')

let IPC = system.ContextMenu


let cusStyle = ref<any>({
})
cusStyle.value.left = computed(() => system.ContextMenu.x.value + 'px')
cusStyle.value.top = computed(() => system.ContextMenu.y.value + 'px')

cusStyle.value.visibility = computed(() => system.ContextMenu.ifShow.value?"visible":"hidden" )

function callFunc(item:menuItem) {
    item.click()
}
</script>
<style scoped>
@import '../../main.css';
.menu_outer {
    position: absolute;
    background-color: rgb(230, 230, 230);
    color: rgb(41, 41, 41);
    border: 0.5px solid rgba(0, 0, 0, 0.418);
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    z-index: 102;
}
.defOver {
    transform: translateY(-100%);
}
.menulist{
    cursor: pointer;
    width: 80px;
    
    /* padding: 4px; */
    padding: 4px 30px;
    font-size: 12px;
}
.menulist:hover{
    background-color: white;
    color: black;
}
</style>