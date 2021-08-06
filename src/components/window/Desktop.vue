<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-05 20:13:32
 * @Description: 
 * @FilePath: /myindex/src/components/window/Desktop.vue
-->
<template>
    <div class="desk_outer">
        <div class="desk_item" v-for="item in deskList" @dblclick="openApp(item)">
            <div class="item_img"><img width="60" :src="item.icon"></div>
            <div class="item_name">{{ item.name }}</div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { Component } from "@vue/runtime-core";
import Test1 from "./apps/Test1.vue";
import Test2 from "./apps/Test2.vue";
import Test3 from "./apps/Test3.vue";
import app_console from "./apps/app_console.vue";
import app_vscode from "./apps/app_vscode.vue";
import { DragWindow } from "./libs/DragWindow";

let appMap: { [T: string]: Component } = {
    Test1,
    Test2,
    Test3,
    app_console,
    app_vscode
}
let appRegMap = {
}

interface deskItem {
    name: string,
    apptemp: string,
    icon:string,
    width:number,
    height:number
}
let deskList: Array<deskItem> = [
    {
        name: '我的电脑',
        apptemp: 'Test1',
        icon:'/电脑.png',
        width:400,
        height:400
    }, {
        name: '版本信息',
        apptemp: 'Test2',
        icon:'/default.png',
        width:100,
        height:100
    }, {
        name: '浏览器',
        apptemp: 'Test3',
        icon:'/浏览器.png',
        width:600,
        height:500
    },{
        name: '终端',
        apptemp: 'app_console',
        icon:'/终端.png',
        width:400,
        height:400
    },{
        name: 'vscode',
        apptemp: "app_vscode",
        icon:'/vscode.png',
        width:600,
        height:500
    }
    
]
function openApp(item: deskItem) {
    if (appMap[item.apptemp] != null) {
        let win = new DragWindow(100, 100, item.name, item.width, item.height, appMap[item.apptemp])

    }
}
</script>
<style scoped>
.desk_outer {
    height: 100vh;
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
.desk_item:hover{
    border: 1px solid rgba(255, 255, 255, 0.521);
    
    background-color: rgba(255, 255, 255, 0.281); 
}
.desk_item:hover .item_name{
    /* color: rgb(141, 141, 141); */
}
.item_img{
    width: 80px;
    height: 68px;
    overflow: hidden;
    padding: 10px;
    text-align: center;
}
.item_name{
    text-align: center;
    font-size: 14px;
    height: 20px;
    line-height: 20px;
}
</style>