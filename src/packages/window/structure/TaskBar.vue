<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-04-02 17:32:11
 * @Description: 
 * @FilePath: /myindex/src/components/window/TaskBar.vue
  Need CodeReview 
-->
<template>
    <div class="bar">
        <div class="winitem_first" @click.prevent.stop="barFirskClick">
            <img draggable="false" :src="winlogo" />
        </div>
        <div class="bar_search">在这里输入你要搜索的内容</div>
        <div
            class="baritem"
            :class="{ showwin: item.ifShow, topwin: item.iftop && item.ifShow }"
            v-for="item in winlist"
            :key="item.id"
            @click="barClick(item)"
            @contextmenu.prevent="rightClick($event, item)"
        >
            <div class="baritem_hover">
                <div class="baritem_hover_top">
                    <img class="baritem_hover_top_img" :src="item.icon" />
                    {{ item.title }}
                    <div @click.stop="closeButtonClicked(item)" class="baritem_hover_top_close">×</div>
                </div>
                <div :id="'hover' + item.id" class="baritem_hover_shoot"></div>
            </div>
            <img :src="item.icon" />
            <!-- {{ item.title }} -->
        </div>
        <MagnetVue v-if="ifMagnetShow" @changevis='changeMagnetShow'></MagnetVue>
        <div class="date_time">
            <div class="date_time_text">
                {{ date_time }}
                <br />
                {{ date_day }}
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import type { WindowInfo } from "../libs/DWM"
import { DWM, PrivateDWM } from "../libs/DWM"
import { MenuCtrl } from "../libs/MenuCtrl"
import { SystemStatus } from "../libs/SystemStatus";
import MagnetVue from "./Magnet.vue";
import winimg from "../../../assets/win.png"
import { appconfig } from "../../appconfig";

//设置winlogo
let winlogo = ref(winimg);
if (appconfig.start_menu_logo == "default") {
    winlogo.value = winimg;
} else {
    winlogo.value = appconfig.start_menu_logo;
}


let winlist = PrivateDWM.getInstance().windowInfoMap

function barClick(item: WindowInfo) {
    if (item.ifShow) {
        PrivateDWM.getInstance().upSetWindowIndex(item.id)
    } else {
        PrivateDWM.getInstance().showWindow(item.id)
        PrivateDWM.getInstance().upSetWindowIndex(item.id)
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
function changeMagnetShow(){
    ifMagnetShow.value = !ifMagnetShow.value
}
function rightClick(e: MouseEvent, item: WindowInfo) {
    if (item.ifShow) {
        MenuCtrl.getInstance().callMenu(e,
            [
                { name: '关闭', func: () => { PrivateDWM.getInstance().destoryWindow(item.id) } },
                { name: '最小化', func: () => { PrivateDWM.getInstance().hideWindow(item.id) } }
            ]
        )
    } else {
        MenuCtrl.getInstance().callMenu(e,
            [
                { name: '关闭', func: () => { PrivateDWM.getInstance().destoryWindow(item.id) } },
                { name: '显示', func: () => { PrivateDWM.getInstance().showWindow(item.id) } }
            ]
        )
    }

}

function closeButtonClicked(item: WindowInfo) {
    PrivateDWM.getInstance().destoryWindow(item.id)
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
    background-color: #d2e3ee;
    z-index: 101;
    --bar-height:30px;
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
    width: 40%;
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
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    /* text-align: center; */
    /* color: white; */
    /* font-size: 12px;
    display: inline-block;
    transform: scale(0.8); */
}
.date_time_text{
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