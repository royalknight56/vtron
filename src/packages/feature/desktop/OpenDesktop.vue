<template>
    <div class="desktop">
        <div class="userarea" @contextmenu.stop="handleRightClick" @mousedown.left="backgroundDown">
            <DeskItem class="userarea-upper zhighher"></DeskItem>
            <DesktopBackground class="userarea-upper"></DesktopBackground>
            <WindowGroup></WindowGroup>
            <NotificationGroup></NotificationGroup>
            <DateTimePop></DateTimePop>
        </div>
        <div class="bottom">
            <Taskbar></Taskbar>
        </div>
        <ContextMenu></ContextMenu>
    </div>
</template>
<script lang="ts" setup>
import DeskItem from './deskItem/DeskItem.vue';
import Taskbar from '../taskbar/Taskbar.vue';
import DesktopBackground from './components/DesktopBackground.vue';
import { emitEvent, mountEvent } from "@packages/feature/event";
import WindowGroup from '../window/WindowGroup.vue';
import ContextMenu from '../contextMenu/ContextMenu.vue';
import NotificationGroup from '../notification/NotifyGroup.vue';
import DateTimePop from '../popover/DateTimePop.vue';
import { useSystem } from '../system';
import vtronicon from '@packages/assets/vtron-icon-nobg.png';
import { createNewFile, createNewDir, openPropsWindow } from "@/packages/hook/useContextMenu"
import { i18n } from '@/packages/feature/i18n';

function backgroundDown(e: MouseEvent) {
    emitEvent('desktop.background.leftClick', e);
}
function handleRightClick(e: MouseEvent) {
    e.preventDefault();
    emitEvent('desktop.background.rightClick', {
        mouse: e,
        menuList: [
            {
                name: i18n('refresh'),
                click: () => {
                }
            },
            {
                name: i18n('new.file'),
                click: () => {
                    createNewFile('/C/Users/Desktop')
                }
            },
            {
                name: i18n('new.folder'),
                click: () => {
                    createNewDir('/C/Users/Desktop')
                }
            }
        ]
    });
}
</script>
<style lang="scss" scoped>
.desktop {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    flex-grow: 0;
    overflow: hidden;

    .zhighher {
        z-index: 2;
    }

    .userarea {
        flex: 1;
        position: relative;
        overflow: hidden;

        .userarea-upper {
            position: absolute;
            top: 0;
            left: 0;
        }
    }
}
</style>