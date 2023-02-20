<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-15 11:08:48
 * @Description: 
 * @FilePath: /myindex/src/components/window/TaskBar.vue
  Need CodeReview 
-->
<!-- 任务栏 -->
<template>
    <div class="bar">
        <div class="bar_left">
            <StartmenuButtonVue></StartmenuButtonVue>
            <template v-for="item in winlist" :key="item.id">
                <AppiconVue :item="item"></AppiconVue>
            </template>
        </div>
        <div class="bar_right">
            <div class="right_item">
                <ChargingVue :sysInfo="sysInfo"></ChargingVue>
            </div>
            <div class="right_item">
                <NetworkVue :sysInfo="sysInfo"></NetworkVue>
            </div>
            <div class="right_item">
                <DateTimeVue></DateTimeVue>
            </div>
            <div class="right_item">
                <NotifyiconVue></NotifyiconVue>
            </div>
            <div class="right_item">
                <div class="right_close_win">
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { computed, inject, ref } from "vue";
import type { WindowInfo, windowInfoMapInter } from "@/packages/window/libs/DragWindow/option"

import NetworkVue from "@structure/taskbarIcon/network.vue";
import ChargingVue from "@structure/taskbarIcon/charging.vue";
import StartmenuButtonVue from "@structure/taskbarIcon/startmenuButton.vue";
import AppiconVue from "./taskbarIcon/appicon.vue";
import DateTimeVue from "./taskbarIcon/dateTime.vue";
import NotifyiconVue from "./taskbarIcon/notifyicon.vue";

import { System } from '@libs/System'
let system = <System>inject('system')

let sysInfo = system.State.sysInfo

let winlist = computed(() => {
    let Obj: windowInfoMapInter = {}
    Object.keys(system.State.windowInfoMap).forEach((key) => {
        if (system.State.windowInfoMap[key].windowInfo.isCreate) {
            Obj[key] = system.State.windowInfoMap[key].windowInfo
        }
    })
    return Obj
})


</script>
<style scoped>
@import "../../main.css";

.bar {
    position: absolute;
    bottom: 0;
    height: var(--bar-height);
    display: flex;
    width: 100%;
    /* overflow: hidden; */
    overflow-y: visible;
    user-select: none;
    align-items: flex-end;
    justify-content: space-between;
    background-color: #d2e3ee;
    z-index: 101;
    --bar-height: 38px;
}

.bar_left {
    height: var(--bar-height);
    width: 100%;
    display: flex;
}

.bar_right {
    height: var(--bar-height);
    display: flex;
    align-items: center;
}

.right_item {
    height: 100%;
    padding: 0 5px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.right_item:hover {
    background-color: #e5eaf2;
}

.right_item img {
    width: 50%;
}

.right_close_win {
    width: 1px;
    height: 100%;
    border-left: 1px solid rgba(0, 0, 0, 0.219);
}
</style>
