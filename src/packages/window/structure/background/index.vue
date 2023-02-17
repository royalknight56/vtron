<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-15 11:08:05
 * @Description: 
-->
<template>
    <div class="background-outer" @contextmenu.prevent="backgroundRightClick" @mousedown="backgroundLeftClick">
        <defaultBackground v-if="appconfig.backimg === 'default'"></defaultBackground>
        <div v-else-if="judgeIsHashColor(appconfig.backimg)" :style="{ background: appconfig.backimg }"
            class="colorbackground-outer"></div>
        <imgBackground v-else></imgBackground>
    </div>
</template>
<script lang="ts" setup>
import defaultBackground from "@structure/background/default.vue";
import imgBackground from "@structure/background/imgbackground.vue";
import { inject } from "vue";
import { System } from '@libs/System'
import { emitEvents } from "../../utils";
let system = <System>inject('system');
const appconfig = system.SystemConfig.config;
function judgeIsHashColor(str: string) {
    let reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    return reg.test(str);
}
function backgroundRightClick(e: MouseEvent) {
    system.ContextMenu.callMenu(e,
        [
            { name: '刷新', click: () => { } },
        ]
    )
}
function backgroundLeftClick(e: MouseEvent) {
    emitEvents(system, 'leftclick.background', e)
}
</script>
<style scoped>
.colorbackground-outer {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    user-select: none;
}
</style>