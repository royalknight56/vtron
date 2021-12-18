<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-12-16 11:16:19
 * @Description:
 * @FilePath: /myindex/src/components/window/Desktop.vue
  Need CodeReview 
-->
<template>
    <div class="desk_outer">
        <div class="desk_item" v-for="item in deskList" @dblclick="openApp(item)" @contextmenu.prevent="rightClick(item,$event)">
            <div class="item_img">
                <img draggable="false" width="60" :src="item.icon" />
            </div>
            <div class="item_name">{{ item.name }}</div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { DragWindow } from "../libs/DragWindow";
import { appList } from "../../appconfig";
import type { appInfo } from "../../appconfig";
import { MenuCtrl } from "../libs/MenuCtrl";
import { DWM } from "../libs/DWM";
import { openInfo } from "../system/openInfo";



let deskList: Array<appInfo> = appList;
function openApp(item: appInfo) {
    item.window.show();
}

function rightClick(item:appInfo,e: MouseEvent) {
    MenuCtrl.getInstance().callMenu(e.pageX, e.pageY,
        [
            { name: '打开(O)', func: () => { item.window.show(); } },
            { name: '属性(R)', func: () => { 
                openInfo({
                    item,
                })
             } },
        ]
    )

}
</script>
<style scoped>
.desk_outer {
    height: calc(100% - 30px);
    width: 10vw;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex-wrap: wrap;
    user-select: none;
}

.desk_item {
    position: relative;
    cursor: default;
    user-select: none;
    box-sizing: border-box;
    width: 100px;
    height: 120px;
    background-color: rgba(119, 119, 119, 0);
    color: white;
    text-shadow: 0px 0px 10px #000000;
    border: 1px solid rgba(0, 0, 0, 0);
}
.desk_item:hover {
    border: 1px solid rgba(255, 255, 255, 0.521);

    background-color: rgba(255, 255, 255, 0.281);
}

.item_img {
    width: 80px;
    height: 68px;
    overflow: hidden;
    padding: 10px;
    text-align: center;
}
.item_name {
    text-align: center;
    font-size: 14px;
    height: 20px;
    line-height: 20px;
}
</style>