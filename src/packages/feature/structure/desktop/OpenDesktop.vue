<template>
  <div class="desktop" @dragenter.prevent @dragover.prevent @drop="refFileDrop($event, '/C/Users/Desktop')">
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
import DeskItem from '@feature/structure/desktop/deskItem/DeskItem.vue';
import Taskbar from '@feature/structure/taskbar/Taskbar.vue';
import DesktopBackground from '@feature/structure/desktop/components/DesktopBackground.vue';
import { emitEvent } from '@feature/event';
import WindowGroup from '@feature/window/WindowGroup.vue';
import ContextMenu from '@feature/structure/contextMenu/ContextMenu.vue';
import NotificationGroup from '@feature/notification/NotifyGroup.vue';
import DateTimePop from '@feature/popover/DateTimePop.vue';
import { useContextMenu } from '@packages/hook/useContextMenu';
import { useFileDrag } from '@packages/hook/useFileDrag';
import { i18n } from '@feature/i18n';
import { useSystem } from '@feature/system';

const { createNewFile, createNewDir } = useContextMenu();
const system = useSystem();
const { refFileDrop } = useFileDrag(system);

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
          //
        },
      },
      {
        name: i18n('new.file'),
        click: () => {
          createNewFile('/C/Users/Desktop');
        },
      },
      {
        name: i18n('new.folder'),
        click: () => {
          createNewDir('/C/Users/Desktop');
        },
      },
    ],
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
