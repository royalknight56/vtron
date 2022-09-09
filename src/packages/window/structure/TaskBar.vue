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
            <div class="winitem_first" @click.prevent.stop="barFirskClick">
                <img draggable="false" :src="winlogo" />
            </div>
            <div class="bar_search">在这里输入你要搜索的内容</div>
            <div
                class="baritem"
                :class="{ showwin: item.isVisible, topwin: item.istop && item.isVisible }"
                v-for="item in winlist"
                :key="item.id"
                @click="barClick(item)"
                @contextmenu.prevent="rightClick($event, item)"
            >
                <div class="baritem_hover">
                    <div class="baritem_hover_top">
                        <img class="baritem_hover_top_img" :src="item.icon" />
                        {{ item.title }}
                        <div
                            @click.stop="closeButtonClicked(item)"
                            class="baritem_hover_top_close"
                        >×</div>
                    </div>
                    <div :id="'hover' + item.id" class="baritem_hover_shoot"></div>
                </div>
                <img :src="item.icon" />
                <!-- {{ item.title }} -->
            </div>
        </div>
        <StartMenuVue v-if="ifMagnetShow"  @changevis="changeMagnetShow"></StartMenuVue>
        <div class="bar_right">
            <div class="right_item">
                <span class="segoicon SEGOEUIMDL"> &#xE010;</span>
            </div>
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
            <div  @click="changeNotifShow" class="right_item">
                <span class="segoicon SEGOEUIMDL"> &#xE91C;</span>
            </div>
            <div class="right_close_win">

            </div>
        </div>
        <!-- <NotificationsVue v-if="ifNotifShow"></NotificationsVue> -->
    </div>
</template>
<script lang="ts" setup>
import { computed, inject, ref } from "vue";
import type { WindowInfo, windowInfoMapInter } from "@libs/DragWindow/type"

import StartMenuVue from "@structure/StartMenu.vue";
import NotificationsVue from "@structure/Notifications.vue";

import NetworkVue from "@structure/taskbarIcon/network.vue";
import ChargingVue from "@structure/taskbarIcon/charging.vue";

import winimg from "../../../assets/win.png"


import {System} from '@libs/System'
let system = <System>inject('system')
const appconfig = system.SystemConfig.config

let sysInfo = system.State.sysInfo
let ContextMenu = system.ContextMenu
//设置winlogo
let winlogo = ref(winimg);
if (appconfig.start_menu_logo == "default") {
    winlogo.value = winimg;
} else {
    winlogo.value = appconfig.start_menu_logo;
}


// let winlist =system.State.windowInfoMap
let winlist =computed(()=>{
    let Obj:windowInfoMapInter = {}
    Object.keys(system.State.windowInfoMap).forEach((key)=>{
        if(system.State.windowInfoMap[key].windowInfo.isCreate){
            Obj[key] = system.State.windowInfoMap[key].windowInfo
            // system.State.windowInfoMap[key].isCreate = false
        }
    })
    return Obj
})
function barClick(item: WindowInfo) {
    if (item.isVisible) {
        system.getWindow(item.id).moveTop()
    } else {
        system.getWindow(item.id).show()
        system.getWindow(item.id).moveTop()
    }
}

let ifMagnetShow = ref(false)
function barFirskClick(e: MouseEvent) {
    ifMagnetShow.value = !ifMagnetShow.value
    document.addEventListener("click", (e) => {
        ifMagnetShow.value = false
    }, {
        once: true
    })
}
function changeMagnetShow() {
    ifMagnetShow.value = !ifMagnetShow.value
}

let ifNotifShow = ref(false);
function changeNotifShow(){
    ifNotifShow.value = !ifNotifShow.value
}
function rightClick(e: MouseEvent, item: WindowInfo) {
    if (item.isVisible) {
        ContextMenu.callMenu(e,
            [
                { name: '关闭', click: () => { system.getWindow(item.id).destroy() } },
                { name: '最小化', click: () => { system.getWindow(item.id).hide() } }
            ]
        )
    } else {
        ContextMenu.callMenu(e,
            [
                { name: '关闭', click: () => { system.getWindow(item.id).destroy() } },
                { name: '显示', click: () => { system.getWindow(item.id).show() } }
            ]
        )
    }

}

function closeButtonClicked(item: WindowInfo) {
    system.getWindow(item.id).destroy()
}
// //定期更换截图
// setInterval(() => {
//     for(let key in winlist){
//         let $dom = document.getElementById('hover'+winlist[key].id)
//         if(winlist[key].screenShoot){
//             $dom?.replaceChildren(<Node>winlist[key].screenShoot)
//         }
//     }
// }, 3000)

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
.right_item{
    margin: 0 3px;
    width: calc(var(--bar-height) * 4/7);
    display: flex;
    align-items: center;
    justify-content: center;
}
.right_item:hover{
    background-color: #e5eaf2;
}
.segoicon{
    font-size: calc(var(--bar-height) * 2/5);
}
.right_item img{
    width:50%;
}
.right_close_win{
    width: 4px;
    border-left: 1px solid rgba(0, 0, 0, 0.219);
}

.baritem {
    box-sizing: border-box;
    padding: 0 0px;
    height: var(--bar-height);

    width: calc(var(--bar-height) * 4 / 3);
    line-height: var(--bar-height);

    /* width: var(--bar-height); */
    /* line-height: var(--bar-height); */
    text-align: center;
    cursor: pointer;
    background-color: rgba(255, 255, 255, 0);
    border: 1px solid rgba(0, 0, 0, 0);
    color: white;
    font-weight: 300;
    font-size: small;
    /* max-width: 100px; */
    /* border: 1px solid rgb(121, 121, 121); */
    white-space: nowrap;
    text-overflow: ellipsis;
    /* overflow: hidden; */
    transition: all 0.1s;
    display: flex;
    align-items: center;
    position: relative;
}
.baritem img {
    width: 50%;
    padding: 0px 0px 0px 0px;
    margin: 0 auto;
}
.baritem:hover {
    /* filter: brightness(130%); */
    background-color: rgba(255, 255, 255, 0.164);
}
.baritem_hover {
    display: none;
    /* display: block; */

    position: absolute;
    bottom: calc(var(--bar-height) - 5px);
    left: -50px;
    width: 180px;
    /* height: 140px; */
    padding-bottom: 10px;
    background-color: #e7e7e7e3;
}
.baritem_hover:hover {
    background-color: #e7e7e7;
}

.baritem_hover_top_close {
    line-height: 30px;
    position: absolute;
    width: 30px;
    height: 30px;
    right: 0px;
    top: 0px;
    cursor: pointer;
    text-align: center;
    font-size: 26px;
    font-weight: 100;
}
.baritem_hover_top_close:hover {
    background-color: red;
    color: white;
}

.baritem_hover_top {
    height: 30px;
    padding: 2px 30px;
    font-size: small;
    font-weight: 300;
    color: black;
    text-align: left;
    display: flex;
    align-items: center;
}
.baritem_hover_top img {
    height: 14px;
    width: 14px;
    margin-right: 8px;
}
.baritem_hover_shoot {
    height: 100px;
}

.baritem:hover .baritem_hover {
    /* animation: hoverplay duration timing-function delay iteration-count direction fill-mode; */
    /* display: none; */
    opacity: 0;
    display: block;

    animation: hoverplay 0.3s forwards;
    animation-delay: 0.5s;
}
@keyframes hoverplay {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}
.winitem_first {
    user-select: none;
    flex-shrink: 0;
    height: var(--bar-height);
    width: calc(var(--bar-height) * 4 / 3);
    line-height: var(--bar-height);
    text-align: center;
    /* border-radius: 25px; */
    color: white;
    /* background-color: rgb(87, 147, 182); */
    background-color: rgba(97, 97, 97, 0);

    /* box-shadow: 0 0 10px 2px rgb(87, 147, 182); */
    transition: all 0.2s;
}
.winitem_first img {
    width: 30%;
    display: inline-block;
    vertical-align: middle;
    /* filter: invert(100%); */
}
.winitem_first:hover {
    background-color: #e5f2fa;
    box-shadow: 1px 2px 10px 2px rgb(231, 231, 231);
    /* filter: brightness(140%); */
}
.bar_search {
    display: none;
    width: 210px;
    height: 100%;
    margin-right: 30px;
    background-color: aliceblue;
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
    /* position: absolute; */
    /* right: 0; */
    /* top: 0; */
    height: 100%;
    /* text-align: center; */
    /* color: white; */
    /* font-size: 12px;
    display: inline-block;
    transform: scale(0.8); */
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

<style>
.baritem_hover canvas {
    /* display: none; */
    width: 150px !important;
    height: 100px !important;
}
</style>