<template>
    <div class="desktop">
        <div class="userarea" @contextmenu.stop="handleRightClick" @mousedown.left="backgroundDown">
            <DeskItem class="userarea-upper zhighher"></DeskItem>
            <DesktopBackground class="userarea-upper"></DesktopBackground>
            <WindowGroup></WindowGroup>
            <NotificationGroup></NotificationGroup>
        </div>
        <div class="bottom">
            <Taskbar></Taskbar>
        </div>
        <ContextMenu></ContextMenu>
    </div>
</template>
<script lang="ts" setup>
import DeskItem from '../deskItem/DeskItem.vue';
import Taskbar from '../taskbar/Taskbar.vue';
import DesktopBackground from './components/DesktopBackground.vue';
import { emitEvent, mountEvent } from "@packages/feature/event";
import WindowGroup from '../window/WindowGroup.vue';
import ContextMenu from '../contextMenu/ContextMenu.vue';
import NotificationGroup from '../notification/NotifyGroup.vue';
function backgroundDown(e: MouseEvent) {
    emitEvent('desktop.background.leftClick', e);
}
function handleRightClick(e: MouseEvent) {
    e.preventDefault();
    emitEvent('desktop.background.rightClick', {
        mouse: e,
        menuList: [
            {
                name: '刷新',
                click: () => {
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