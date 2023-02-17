<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-15 11:09:29
 * @Description:
 * @FilePath: /myindex/src/components/window/Desktop.vue
  Need CodeReview 
-->
<template>
    <div class="desk-outer" @mouseup="onDragEnd">
        <div class="desk-item" v-for="(item, index) in appList" 
            @keyup.enter.native="openApp(item)"
            @dblclick="openApp(item)" 
            :ref="(el) => {
                iconPos[index].dom = el as HTMLElement;
            }" 
            @contextmenu.prevent="rightClick(item, $event)" 
            @mousedown="onDragStart(index, $event)"
            @mousemove="onDragMove(index, $event)" 
            :style="{
                left: iconPos[index].x + 'px',
                top: iconPos[index].y + 'px',
                zIndex: iconPos[index].isDrag ? 100 : 0
            }" 
            :tabIndex="index + 1">
            <div class="desk-icon">
                <img class="desk-item_img" draggable="false" :alt="item.name" :src="item.icon" />
            </div>
            <div class="desk-item_name">{{ item.name }}</div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { UnwrapNestedRefs } from "vue";
import { inject, reactive } from "vue";
import type { appInfo } from "@state/type"
import { openInfo } from "@builtin/callSystemWins";
import { System } from '@libs/System';
import { emitEvents } from '@/packages/window/utils/index';

let system = <System>inject('system')

const MAX_ICON_COUNT = 99
interface posItem {
    dom: Element | null,
    isDrag: boolean,
    x: number,
    y: number,
    startX: number,
    startY: number,
    posCurrentX: number,
    posCurrentY: number,
}
let iconPos: Array<posItem> = reactive([]);
let currentMoveIcon: number = -1;
let appList = system.State.appList
for (let i = 0; i < MAX_ICON_COUNT; i++) {
    iconPos.push({
        dom: null,
        isDrag: false,
        x: 0,
        y: 0,
        startX: 0,
        startY: 0,
        posCurrentX: 0,
        posCurrentY: 0,
    })
}

function onDragStart(i: number, ev: MouseEvent) {
    currentMoveIcon = i;
    iconPos[i].isDrag = true
    iconPos[i].startX = ev.pageX
    iconPos[i].startY = ev.pageY;
    iconPos[i].posCurrentX = iconPos[i].x;
    iconPos[i].posCurrentY = iconPos[i].y;
}
function onDragMove(i: number, ev: MouseEvent) {
    if (iconPos[i].isDrag) {
        iconPos[i].x = ev.pageX - iconPos[i].startX + iconPos[i].posCurrentX
        iconPos[i].y = ev.pageY - iconPos[i].startY + iconPos[i].posCurrentY
    }
}
function onDragEndCheck(item: posItem) {
    item.x = 0;
    item.y = 0;
    let lastTemp = -1
    let cur = item.dom?.getBoundingClientRect();
    for (let i = 0; i < appList.length; i++) {
        let temp = iconPos[i].dom?.getBoundingClientRect();
        if (temp && cur && item !== iconPos[i]) {
            if (cur.left > temp.left
                && cur.top > temp.top) {
                lastTemp = i
            }
        }
    }
}
function onDragEnd() {
    if (currentMoveIcon >= 0) {
        iconPos[currentMoveIcon].isDrag = false
        onDragEndCheck(iconPos[currentMoveIcon])
        currentMoveIcon = -1
    }
}
window.addEventListener('mousemove', moveCheck)
function moveCheck(ev: MouseEvent) {
    // 判断左键是否按下
    if (currentMoveIcon >= 0 && ev.buttons === 0) {
        onDragEnd()
    }
}
function openApp(item: UnwrapNestedRefs<appInfo>) {
    emitEvents(system, "open.app.desktop");
    item.window.show({ callFrom: "desktop" });
}

function rightClick(item: UnwrapNestedRefs<appInfo>, e: MouseEvent) {
    system.ContextMenu.callMenu(e,
        [
            { name: '打开(O)', click: () => { item.window.show(); } },
            {
                name: '属性(R)', click: () => {
                    openInfo(system, {
                        item,
                    })
                }
            },
        ]
    )

}
</script>
<style scoped>
@import '../../main.css';

.desk-outer {
    height: calc(100% - 30px);
    width: min-content;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    align-content: flex-start;
    flex-wrap: wrap;
    user-select: none;
    z-index: 1;
    position: relative;
}

.desk-item {
    position: relative;
    cursor: default;
    user-select: none;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100px;
    height: 100px;
    background-color: rgba(119, 119, 119, 0);
    color: rgb(220, 220, 220);
    /* text-shadow: 2px 2px 3px #000000; */
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.814), -1px -1px 1px rgba(0, 0, 0, 0.728);
    /* -webkit-text-stroke: 1px #000000; */
    border: 1px solid rgba(0, 0, 0, 0);
}

.desk-item:hover {
    border: 1px solid rgba(255, 255, 255, 0.521);

    background-color: rgba(255, 255, 255, 0.281);
}

.desk-icon {
    width: 60px;
    height: 60px;
    overflow: hidden;
    /* padding: 5px 5px 0px 5px; */
    text-align: center;
}

.desk-icon img {
    width: 100%;
    height: 100%;
}

.desk-item_img {
    margin: 0 auto;
}

.desk-item_name {
    margin-top: 2px;
    text-align: center;
    font-size: 13px;
    height: 20px;
    line-height: 20px;
}
</style>