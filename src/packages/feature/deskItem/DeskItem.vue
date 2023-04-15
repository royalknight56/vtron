<template>
    <div class="desk-group">
        <div @dblclick="openapp(item)" @contextmenu.stop.prevent="handleRightClick($event, item)" class="desk-item"
            v-for="item in appList" :key="item.name">
            <!-- <img draggable="false" class="desk-item_img" :src="item.icon" alt=""> -->

            <img class="desk-item_img" v-if="item.icon === 'dir'" draggable="false" :src="foldericon" />
            <img class="desk-item_img" v-else-if="item.icon === 'file'" draggable="false" :src="unknownicon" />
            <img class="desk-item_img" v-else-if="item.icon" draggable="false" :src="item.icon" />
            <img class="desk-item_img" v-else draggable="false" :src="unknownicon" />

            <span class="desk-item_title">{{ item.name }}</span>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { useAppOpen } from '@/packages/hook/useAppOpen';
import { BrowserWindow, useSystem, WinApp } from '@/packages/plug';
import FileProps from '../builtin/FileProps.vue';
import { emitEvent } from '../event';
import foldericon from "@/packages/assets/folder.ico";
import unknownicon from "@/packages/assets/unknown.ico";
const { openapp, appList } = useAppOpen('apps');

function handleRightClick(mouse: MouseEvent, item: WinApp) {
    emitEvent('contextMenu.show', {
        mouse: mouse,
        menuList: [
            {
                name: '打开',
                click: () => openapp(item)
            },
            {
                name: '属性',
                click: () => {
                    new BrowserWindow({
                        title: '属性',
                        content: FileProps,
                        config: {
                            content: item
                        },
                        width: 350,
                        height: 400,
                        resizable: false,
                    }).show();
                    // useSystem()?.fs.unlink(item.path);
                }
            },
            {
                name: '删除',
                click: () => {
                    useSystem()?.fs.unlink(item.path);
                }
            }
        ]
    })
}
</script>
<style lang="scss" scoped>
.desk-group {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    height: 100%;
    user-select: none;

    .desk-item {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: var(--desk-item-size);
        height: var(--desk-item-size);
        font-size: var(--ui-font-size);
        margin: 6px;

        .desk-item_img {
            width: 60%;
            height: 60%;
            margin: 4px auto;
        }

        .desk-item_title {
            color: var(--color-ui-desk-item-title);
            display: block;
            text-align: center;
        }
    }

    .desk-item:hover {
        background-color: #3bdbff4c;
    }
}
</style>