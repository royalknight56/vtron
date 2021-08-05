<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-05 18:32:33
 * @Description: 
 * @FilePath: /myindex/src/components/window/apps/Test1.vue
-->
<template>
    <div class="uper">
        <div class="group">
            <div class="button" @click="backFolder()">返回</div>
        <div class="button" @click="newFolder()">新建</div>
        </div>

        <div class="path">
            <span v-for="item in folderStack">{{ item.name }}/</span>
        </div>
    </div>
    <div class="desk_outer">
        <div class="desk_item" v-for="item in currentList" @dblclick="openFolder(item)">
            <div class="item_img">
                <img width="50" src="/folder.png" />
            </div>
            <div class="item_name">{{ item.name }}</div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { reactive } from "@vue/reactivity";
import type { UnwrapNestedRefs } from "@vue/reactivity";

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
    width: 70px;
    height: 80px;
    background-color: rgba(119, 119, 119, 0);
    color: white;
    text-shadow: 0px 0px 3px #000000;
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
    width: 50px;
    height: 40px;
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

.uper {
    height: 40px;
    background-color: rgba(255, 235, 205, 0);
    font-size: 12px;
    font-weight: 400;
    border-bottom: 1px solid black;
}
.group{
    display: flex;
}
.button{
    cursor: pointer;
    text-align: center;
    width: 50px;
    transition: all 0.1s;
}
.button:hover{
    background-color: rgba(0, 0, 0, 0.137);
}
.path{
    padding: 0 5px;
    border: 1px solid rgba(0, 0, 255, 0);
    transition: all 0.1s;

}
.path:hover{
    border: 1px solid rgb(0, 102, 255);
}
</style>