<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-06 09:32:05
 * @Description: 
 * @FilePath: /myindex/src/components/window/TaskBar.vue
-->
<template>
    <div class="bar">
        <div class="winitem_first" @click.prevent.stop="barFirskClick">
            <img draggable="false" width="20" src="/win.png" />
        </div>
        <div
            class="winitem"
            :class="{ showwin: item.ifShow, topwin: item.iftop && item.ifShow }"
            v-for="item in winlist"
            :key="item.id"
            @click="barClick(item)"
            @contextmenu.prevent="rightClick($event, item)"
        >{{ item.title }}</div>
    </div>
</template>
<script lang="ts" setup>
import type { PropType } from "@vue/runtime-core";
import type { PageItem } from "./libs/WindowIPC"
import { WindowIPC } from "./libs/WindowIPC"
import { MenuIPC } from "./libs/MenuIPC"
import { computerCTC } from "../computerCTC";



let winlist = WindowIPC.getInstance().pageMap

function barClick(item: PageItem) {
    if (item.ifShow) {
        WindowIPC.getInstance().upSetWindowIndex(item.id)
    } else {
        WindowIPC.getInstance().showWindow(item.id)
        WindowIPC.getInstance().upSetWindowIndex(item.id)
    }
}
function barFirskClick(e: MouseEvent) {
    MenuIPC.getInstance().callMenu(0, e.pageY,
        [
            { name: '关机', func: () => { console.log("关机"); computerCTC.getInstance().closePower() } },
            { name: '重启', func: () => { console.log("重启"); computerCTC.getInstance().restartPower() } }

        ]
    )
}
function rightClick(e: MouseEvent, item: PageItem) {
    if (item.ifShow) {
        MenuIPC.getInstance().callMenu(e.pageX, e.pageY,
            [
                { name: '关闭', func: () => { WindowIPC.getInstance().destoryWindow(item.id) } },
                { name: '最小化', func: () => { WindowIPC.getInstance().hideWindow(item.id) } }
            ]
        )
    } else {
        MenuIPC.getInstance().callMenu(e.pageX, e.pageY,
            [
                { name: '关闭', func: () => { WindowIPC.getInstance().destoryWindow(item.id) } },
                { name: '显示', func: () => { WindowIPC.getInstance().showWindow(item.id) } }
            ]
        )
    }

}
</script>
<style scoped>
.bar {
    position: absolute;
    bottom: 0;
    height: 30px;
    display: flex;
    width: 100%;
    /* overflow: hidden; */
    overflow-y: visible;
    user-select: none;
    align-items: flex-end;
    background-color: rgb(32, 32, 32);
    z-index: 101;
}
.winitem {
    box-sizing: border-box;
    padding: 0 10px;
    height: 30px;
    line-height: 30px;
    cursor: pointer;
    background-color: rgba(255, 255, 255, 0);
    border: 1px solid rgba(0, 0, 0, 0);
    color: white;
    font-weight: 300;
    font-size: small;
    max-width: 100px;
    /* border: 1px solid rgb(121, 121, 121); */
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    transition: all 0.1s;
}
.winitem:hover{
    /* filter: brightness(130%); */
    background-color: rgba(255, 255, 255, 0.164);

}
.winitem_first {
    user-select: none;
    flex-shrink: 0;
    height: 30px;
    width: 60px;
    line-height: 40px;
    text-align: center;
    /* border-radius: 25px; */
    color: white;
    /* background-color: rgb(87, 147, 182); */
    background-color: rgba(97, 97, 97, 0);

    /* box-shadow: 0 0 10px 2px rgb(87, 147, 182); */
    transition: all 0.2s;
}
.winitem_first img {
    filter: invert(100%);
}
.winitem_first:hover {
    background-color: rgb(87, 147, 182);
    box-shadow: 1px 2px 10px 2px rgb(87, 147, 182);
}
.showwin {
    background-color: rgba(255, 255, 255, 0);
    border-bottom: 3px solid rgba(255, 255, 255, 0.712);
}
.topwin {
    background-color: rgba(255, 255, 255, 0.37);
    /* border: 1px solid rgb(87, 147, 182); */
}
.topwin:hover{
    background-color: rgba(255, 255, 255, 0.438);

}
</style>