<template>
    <div class="outer">
        <div class="tab">
            <div class="tab-item">
                常规
            </div>
        </div>
        <div class="content">
            <div class="propitem">
                <div class="propname"><img class="file-icon" :src="file?.icon"></div>
                <div class="propvalue">{{ file?.name }}</div>
            </div>
            <div class="split-line"></div>
            <div class="propitem">
                <div class="propname">文件类型：</div>
                <div class="propvalue">{{ file?.type }}<WinButton class="some-button" @click="editType">修改类型</WinButton></div>
            </div>
            <div class="propitem">
                <div class="propname">位置：</div>
                <div class="propvalue">{{ file?.path }}</div>
            </div>
        </div>
        <div class="button-group">
            <WinButton @click="confirm">确定</WinButton>
            <WinButton @click="confirm">取消</WinButton>
        </div>
    </div>
</template>
<script setup lang="ts">
import WinButton from '@/packages/components/WinButton.vue';
import { inject } from 'vue';
import { useSystem } from '../system';
import { BrowserWindow } from '../window/BrowserWindow';
import EditType from "./EditType.vue"
let window: BrowserWindow | undefined = inject('browserWindow');

let file = await useSystem()?.fs.stat(window?.config.content.path);

function confirm(){
    window?.close();
}
function editType(){
    new BrowserWindow({
        title: '修改类型',
        content:EditType,
        config: {
            content:file
        },
        width: 300,
        height: 200,
        center: true,
        resizable: false,
    }).show();
}
</script>
<style lang="scss" scoped>
.outer {
    display: flex;
    flex-direction: column;
    background-color: var(--color-ui-gray);
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
    font-size: var(--ui-font-size);

    .tab {
        display: flex;
        flex-direction: row;
        height: var(--ui-list-item-height);
        transform: translateY(1px);

        .tab-item {
            width: 50px;
            text-align: center;
            padding-top: 2px;
            border: var(--light-border);
            border-bottom: none;
            background-color: #fff;
        }
    }

    .content {
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        background-color: #fff;
        border: var(--light-border);

        .split-line {
            height: 1px;
            width: calc(100% - 30px);
            background-color: #252525;
            margin: 6px;
        }

        .propitem {
            display: flex;
            flex-direction: row;
            justify-content: center;
            padding: 4px;
            width: 100%;

            .propname {
                width: 80px;
                margin-left: 20px;
            }

            .file-icon {
                width: calc(var(--ui-list-item-height)*2);
                height: calc(var(--ui-list-item-height)*2);
            }

            .propvalue {
                flex: 1;
                display: flex;
                align-items: center;
                // justify-content: space-between;
            }
        }
    }
    .button-group{
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        margin-top: 10px;
        gap: 10px;
    }
    .some-button{
        margin-left: 10px;
    }

}</style>