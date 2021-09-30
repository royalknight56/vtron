<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-09-30 14:36:28
 * @Description: 
 * @FilePath: /myindex/src/components/apps/MyComputer.vue
-->
<template>
    <div class="uper">
        <div class="group">
            <div class="button">文件</div>
            <div class="button">计算机</div>
            <div class="button">查看</div>

            <!-- <div class="button" @click="backFolder()">返回</div>
            <div class="button" @click="newFolder()">新建</div> -->
        </div>

        <div class="path">
            <span v-for="item in folderStack">{{ item.name }}/</span>
        </div>
    </div>
    <div class="desk_outer">
        <div class="desk_item" v-for="item in currentList" @dblclick="openFolder(item)">
            <div class="item_img">
                <!-- <svg t="1629880946543" class="icon" viewBox="0 0 1126 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="11619" width="50" height="50"><path d="M1076.875776 998.4H49.803776A49.152 49.152 0 0 1 0.139776 950.016V148.736a49.408 49.408 0 0 1 49.664-49.152h1027.072A49.408 49.408 0 0 1 1126.539776 148.736v801.28A49.408 49.408 0 0 1 1076.875776 998.4z" fill="#FFE9B8" p-id="11620"></path><path d="M563.339776 336.64H0.139776V51.2a47.616 47.616 0 0 1 45.056-51.2H435.339776a51.2 51.2 0 0 1 47.616 39.424z" fill="#FFC112" p-id="11621"></path><path d="M1081.483776 1024H45.195776A47.616 47.616 0 0 1 0.139776 972.8V250.368a47.616 47.616 0 0 1 45.056-49.92h1036.288A47.616 47.616 0 0 1 1126.539776 250.368v723.712A47.872 47.872 0 0 1 1081.483776 1024z" fill="#FFD741" p-id="11622"></path></svg> -->
                <img width="50" :src="folderimg" />
            </div>
            <div class="item_name">{{ item.name }}</div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { reactive } from "vue";
import type { UnwrapNestedRefs } from "@vue/reactivity";
import folderimg from "../../assets/newFolder.ico"
interface Folder {
    name: string,
    children: Array<Folder>,
    parent?: Folder
}
let folder: Folder = {
    name: 'C:/',
    children: [{
        name: 'User',
        children: [{
            name: 'Administrator',
            children: []
        },
        {
            name: '12',
            children: []
        }],
    },
    {
        name: 'jpa',
        children: []
    }],
}
let folderStack: UnwrapNestedRefs<Array<Folder>> = reactive([folder]);

let currentList: UnwrapNestedRefs<Array<Folder>> = reactive([])
currentList.push(...folder.children)

function openFolder(folder: Folder) {

    folderStack.push(folder)
    currentList.splice(0, currentList.length);
    currentList.push(...folder.children)
}
function backFolder() {
    if (folderStack.length > 1) {
        folderStack.pop();
        currentList.splice(0, currentList.length);
        currentList.push(...folderStack[folderStack.length - 1].children)
    }
}
function newFolder() {
    let newF = {
        name: '新建文件夹',
        children: [],
    }
    folderStack[folderStack.length - 1].children.push(newF)
    currentList.push(newF)
}
</script>
<style scoped>
.desk_outer {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    flex-wrap: wrap;
}

.desk_item {
    position: relative;
    cursor: default;
    user-select: none;
    box-sizing: border-box;
    /* display: flex; */
    /* align-items: center; */
    width: 70px;
    height: 50px;
    background-color: rgba(119, 119, 119, 0);
    color: white;
    /* text-shadow: 0px 0px 3px #000000; */
    border: 1px solid rgba(0, 0, 0, 0);
}
.desk_item:hover {
    border: 1px solid rgba(255, 255, 255, 0.521);

    background-color: rgba(255, 255, 255, 0.281);
}
.item_img {
    width: 50px;
    height: 40px;
    overflow: hidden;
    padding: 10px;
    text-align: center;
}
.item_name {
    color: rgba(0, 0, 0, 0.664);
    text-align: center;
    font-size: 14px;
    font-weight: 400;
    height: 20px;
    line-height: 20px;
}

.uper {
    height: 40px;
    background-color: rgba(255, 235, 205, 0);
    font-size: 12px;
    font-weight: 300;
    border-bottom: 1px solid black;
}
.group {
    display: flex;
}
.button {
    cursor: pointer;
    text-align: center;
    width: 50px;
    transition: all 0.1s;
    background: #ffffff;
    font-family: sans-serif;
    font-size: 12px;
    border: 2px solid white;
    padding: 0px 4px;
    transition: 0.1s;
}

.button:hover {
    background-color: #137bd2;
    color: white;
}
.path {
    padding: 0 5px;
    border: 1px solid rgba(0, 0, 255, 0);
    transition: all 0.1s;
}
.path:hover {
    border: 1px solid rgb(0, 102, 255);
}
</style>