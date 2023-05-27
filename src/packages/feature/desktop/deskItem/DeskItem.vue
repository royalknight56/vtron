<template>
    <div class="desk-group">
        <div @dblclick="openapp(item)" @contextmenu.stop.prevent="handleRightClick($event, item)" class="desk-item"
            v-for="item in appList" :key="basename(item.path)">
            <div class="desk-item_img">
                <FileIcon :file="item" />
            </div>
            <span class="desk-item_title">{{ basename(item.path) }}</span>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { useAppOpen } from '@/packages/hook/useAppOpen';
import { BrowserWindow, useSystem, WinApp } from '@/packages/plug';
import { emitEvent } from '@/packages/feature/event';
import FileIcon from "@/packages/feature/builtin/FileIcon.vue";
import { createNewFile, openPropsWindow } from "@/packages/hook/useContextMenu"
import { basename } from "@/packages/feature/core/Path"
import { VtronFile } from "@packages/feature/core/fileSystem";

const { openapp, appList } = useAppOpen('apps');

const sys  = useSystem()
function handleRightClick(mouse: MouseEvent, item: VtronFile) {
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
                    openPropsWindow(item.path)
                }
            },
            {
                name: '删除',
                click: () => {
                    if (item.isDirectory) {
                        sys?.fs.rmdir(item.path)
                    } else {
                        sys?.fs.unlink(item.path)
                    }
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