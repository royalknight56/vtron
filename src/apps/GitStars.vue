<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-18 16:54:33
 * @Description: 
 * @FilePath: /myindex/src/apps/GitStars.vue
-->
<template>
    <div>Loading</div>
</template>
<script lang="ts" setup>

import type { PageItem } from "../components/window/libs/WindowIPC"
import { WindowIPC } from "../components/window/libs/WindowIPC"
import type { PropType } from "vue"

let props = defineProps({
    ctx: {
        type: Object as PropType<PageItem>
    }
})
setTimeout(() => {
    if (props.ctx?.id) {
        WindowIPC.getInstance().destoryWindow(props.ctx?.id)
    }
    window.open('https://github.com/royalknight56/vue-windows10')
})


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