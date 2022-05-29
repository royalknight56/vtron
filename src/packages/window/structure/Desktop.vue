<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-05-29 20:32:52
 * @Description:
 * @FilePath: /myindex/src/components/window/Desktop.vue
  Need CodeReview 
-->
<template>
    <div class="desk_outer" @mouseup="onDragEnd">
        <div class="desk_item" v-for="(item, index) in appList" @dblclick="openApp(item)" :ref="(el) => {
            iconPos[index].dom = el as HTMLElement;
        }" @contextmenu.prevent="rightClick(item, $event)" @mousedown="onDragStart(index, $event)"
            @mousemove="onDragMove(index, $event)" :style="{
                left: iconPos[index].x + 'px',
                top: iconPos[index].y + 'px',
                zIndex: iconPos[index].isDrag ? 100 : 0
            }">
            <div class="item_img">
                <img class="item_img-img" draggable="false"
                    :src="item.icon || 'data:image/png;base64,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'" />
            </div>
            <div class="item_name">{{ item.name }}</div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { UnwrapNestedRefs } from "@vue/reactivity";
import { reactive } from "vue";
import { appList } from "@state/index";
import type { appInfo } from "@state/type"
import { MenuCtrl } from "@libs/MenuCtrl";
import { openInfo } from "@system/callSystemWins";
import { watch } from "fs";

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
    // console.log('dragmove', ev.clientX, ev.clientY)
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
    // 得出lastTemp：需要交换到的位置
    if (lastTemp >= 0) {
        let curappInfo = appList[currentMoveIcon]
        appList.splice(currentMoveIcon, 1);
        appList.splice(lastTemp, 0, curappInfo);
    }


}
function onDragEnd() {
    // console.log('dragend', ev.clientX, ev.clientY)
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
// let deskList: UnwrapNestedRefs<Array<appInfo>> = appList;
function openApp(item: UnwrapNestedRefs<appInfo>) {

    item.window.show();
}

function rightClick(item: UnwrapNestedRefs<appInfo>, e: MouseEvent) {
    MenuCtrl.getInstance().callMenu(e,
        [
            { name: '打开(O)', func: () => { item.window.show(); } },
            {
                name: '属性(R)', func: () => {
                    openInfo({
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

.desk_outer {
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

.desk_item {
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
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.814), -1px -1px 1px rgba(0, 0, 0, 0.728);
    /* -webkit-text-stroke: 1px #000000; */
    border: 1px solid rgba(0, 0, 0, 0);
}

.desk_item:hover {
    border: 1px solid rgba(255, 255, 255, 0.521);

    background-color: rgba(255, 255, 255, 0.281);
}

.item_img {
    width: 60px;
    height: 60px;
    overflow: hidden;
    /* padding: 5px 5px 0px 5px; */
    text-align: center;
}

.item_img img {
    width: 100%;
    height: 100%;
}

.item_img-img {
    margin: 0 auto;
}

.item_name {
    margin-top: 2px;
    text-align: center;
    font-size: 13px;
    height: 20px;
    line-height: 20px;
}
</style>