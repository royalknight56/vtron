<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-18 17:06:42
 * @Description: 
 * @FilePath: /myindex/src/apps/Adm_loading.vue
-->
<template>
    <div>Loading</div>
</template>
<script lang="ts" setup>

// import { DragWindow } from "../components/window/libs/DragWindow";
// import AdmVue from "./Adm.vue";
// import ElementPlus from 'element-plus';
import type { PageItem } from "../components/window/libs/WindowIPC"
import { WindowIPC } from "../components/window/libs/WindowIPC"
import { defineComponent, DefineComponent, PropType } from "vue"
 
defineComponent
let props = defineProps({
    ctx: {
        type: Object as PropType<PageItem>
    }
})
setTimeout(() => {
    if (props.ctx?.id) {
        WindowIPC.getInstance().destoryWindow(props.ctx?.id)
    }
    // new DragWindow(0, 0, 'Admin后台管理', 300, 400, { content: AdmVue},[ElementPlus])
}, 1000)


</script>

<style scoped>
.t2 {
    z-index: 99;
    background-color: blanchedalmond;
}
.t2:hover {
    background-color: rgba(255, 235, 205, 0.747);
}
</style>