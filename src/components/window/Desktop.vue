<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-09-14 16:41:44
 * @Description: 
 * @FilePath: /myindex/src/components/window/Desktop.vue
-->
<template>
    <div class="desk_outer">
        <div class="desk_item" v-for="item in deskList" @dblclick="openApp(item)">
            <div class="item_img">
                <img width="60" :src="item.icon" />
            </div>
            <div class="item_name">{{ item.name }}</div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { DragWindow } from "./libs/DragWindow";
import { appList } from "../appconfig";
import type { appInfo } from "../appconfig";

let deskList: Array<appInfo> = appList;
function openApp(item: appInfo) {
    new DragWindow(100, 100, item.name,item.icon,item.width, item.height, {content:item.tmp},item.use)
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
.desk_item:hover .item_name {
    /* color: rgb(141, 141, 141); */
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