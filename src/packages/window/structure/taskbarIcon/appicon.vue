<template>
    <div class="baritem" :class="{ showwin: item.isVisible, topwin: item.istop && item.isVisible }"
        @click="barClick(item)" @contextmenu.prevent="rightClick($event, item)">
        <div class="baritem_hover">
            <div class="baritem_hover_top">
                <img class="baritem_hover_top_img" :src="item.icon" />
                {{ item.title }}
                <div @click.stop="closeButtonClicked(item)" class="baritem_hover_top_close">×</div>
            </div>
            <div :id="'hover' + item.id" class="baritem_hover_shoot"></div>
        </div>
        <img :src="item.icon" />
    </div>
</template>
<script lang="ts" setup>
import type { WindowInfo, windowInfoMapInter } from "@/packages/window/libs/DragWindow/option"
import { System } from '@libs/System'
import { inject } from "vue";
let system = <System>inject('system')
defineProps<{
    item: WindowInfo
}>()
let sysInfo = system.State.sysInfo
let ContextMenu = system.ContextMenu
function barClick(item: WindowInfo) {
    if (item.isVisible) {
        system.getWindow(item.id)?.moveTop()
    } else {
        system.getWindow(item.id)?.show()
        system.getWindow(item.id)?.moveTop()
    }
}

function rightClick(e: MouseEvent, item: WindowInfo) {
    if (item.isVisible) {
        ContextMenu.callMenu(e,
            [
                { name: '关闭', click: () => { system.getWindow(item.id)?.destroy() } },
                { name: '最小化', click: () => { system.getWindow(item.id)?.hide() } }
            ]
        )
    } else {
        ContextMenu.callMenu(e,
            [
                { name: '关闭', click: () => { system.getWindow(item.id)?.destroy() } },
                { name: '显示', click: () => { system.getWindow(item.id)?.show() } }
            ]
        )
    }

}

function closeButtonClicked(item: WindowInfo) {
    system.getWindow(item.id)?.destroy()
}

</script>
<style scoped>
@import "../../../main.css";
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
</style>