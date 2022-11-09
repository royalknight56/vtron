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
            <div class="date_time">
                <div class="date_time_text">
                    {{ date_time }}
                    <br />
                    {{ date_day }}
                </div>
            </div>
            <div @click="changeNotifShow" class="right_item">
                <span class="segoicon SEGOEUIMDL"> &#xE91C;</span>
            </div>
            <div class="right_close_win">
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

let ifNotifShow = ref(false);
function changeNotifShow() {
    ifNotifShow.value = !ifNotifShow.value
}

// 设置时间日期
let date_day = ref('')
let date_time = ref('')
date_time.value = new Date().toLocaleTimeString()
date_day.value = new Date().toLocaleDateString()
setInterval(() => {
    let newDate = new Date()
    date_time.value = newDate.getHours().toString().padStart(2, '0') + ':' + newDate.getMinutes().toString().padStart(2, '0')
    date_day.value = new Date().toLocaleDateString()
}, 400)
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
}

.right_item {
    margin: 0 3px;
    width: calc(var(--bar-height) * 4/7);
    display: flex;
    align-items: center;
    justify-content: center;
}

.right_item:hover {
    background-color: #e5eaf2;
}

.segoicon {
    font-size: calc(var(--bar-height) * 2/5);
}

.right_item img {
    width: 50%;
}

.right_close_win {
    width: 4px;
    border-left: 1px solid rgba(0, 0, 0, 0.219);
}



.showwin {
    background-color: rgba(255, 255, 255, 0);
    border-bottom: 3px solid rgba(255, 255, 255, 0.712);
}

.topwin {
    background-color: rgba(255, 255, 255, 0.37);
    /* border: 1px solid rgb(87, 147, 182); */
}

.topwin:hover {
    background-color: rgba(255, 255, 255, 0.438);
}

.date_time {
    justify-self: flex-end;
    height: 100%;
}

.date_time_text {
    text-align: center;
    font-size: 12px;
    display: inline-block;
    transform: scale(0.8);
}

.date_time:hover {
    background-color: #e5eaf2;
}
</style>
