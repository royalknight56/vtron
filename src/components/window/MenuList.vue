<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-18 16:55:28
 * @Description: 
 * @FilePath: /myindex/src/components/window/MenuList.vue
-->
<template>
    <div class="menu_outer" :style="cusStyle" :class="{ defOver: IPC.ifTopDown }">
        <div class="menulist" v-for="item in IPC.menuList" @click="callFunc(item)">{{ item.name }}</div>
    </div>
</template>
<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { MenuIPC } from "./libs/MenuIPC";
import type {menuItem}from "./libs/MenuIPC";

let IPC = MenuIPC.getInstance()

let IPClist = computed(() => {
    return MenuIPC.getInstance().menuList
})

let cusStyle = ref<any>({
})
cusStyle.value.left = computed(() => MenuIPC.getInstance().x.value + 'px')
cusStyle.value.top = computed(() => MenuIPC.getInstance().y.value + 'px')

cusStyle.value.visibility = computed(() => MenuIPC.getInstance().ifShow.value?"visible":"hidden" )

function callFunc(item:menuItem) {
    item.func()
}
</script>
<style>
.menu_outer {
    position: absolute;
    background-color: rgb(230, 230, 230);
    color: rgb(41, 41, 41);
    border: 0.5px solid rgba(0, 0, 0, 0.418);
    z-index: 102;
}
.defOver {
    transform: translateY(-100%);
}
.menulist{
    cursor: pointer;
    width: 100px;
    padding: 4px;
    font-size: 12px;
}
.menulist:hover{
    background-color: white;
    color: black;
}
</style>