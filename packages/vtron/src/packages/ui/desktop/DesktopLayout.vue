<template>
  <div
    class="desktop"
    @dragenter.prevent
    @dragover.prevent
    @drop="dragFileToDrop($event, `${system._options.userLocation}Desktop`)"
    :style="{
      filter: `brightness(${system._rootState.info.brightness * 2}%)`,
    }"
  >
    <div class="userarea" @contextmenu.stop="handleRightClick" @mousedown="userareaDown">
      <div @mousedown="backgroundDown">
        <DeskItem class="userarea-upper zhighher" :on-chosen="onChosen"></DeskItem>
        <DesktopBackground class="userarea-upper"></DesktopBackground>
      </div>
      <WindowGroup></WindowGroup>
      <NotificationGroup></NotificationGroup>
      <MessageCenterPop></MessageCenterPop>
      <Chosen></Chosen>
    </div>
    <div class="bottom">
      <Taskbar></Taskbar>
    </div>
    <ContextMenu></ContextMenu>
  </div>
</template>
<script lang="ts" setup>
import DeskItem from '@packages/ui/desktop/components/DeskItem.vue';
import Taskbar from '@packages/ui/taskbar/Taskbar.vue';
import DesktopBackground from '@packages/ui/desktop/components/DesktopBackground.vue';
import { emitEvent } from '@packages/kernel';
import WindowGroup from '@packages/ui/window/WindowGroup.vue';
import ContextMenu from '@packages/ui/menu/ContextMenu.vue';
import NotificationGroup from '@packages/services/notification/NotifyGroup.vue';
import MessageCenterPop from '@packages/ui/taskbar/popover/MessageCenterPop.vue';
import { useContextMenu } from '@packages/hook/useContextMenu';
import { useFileDrag } from '@packages/hook/useFileDrag';
import { Rect, useRectChosen } from '@packages/hook/useRectChosen';
import { useSystem } from '@packages/kernel';
import { onErrorCaptured } from 'vue';

const { createDesktopContextMenu } = useContextMenu();
const { choseStart, chosing, choseEnd, getRect, Chosen } = useRectChosen();
const system = useSystem();
const { dragFileToDrop } = useFileDrag(system);

let chosenCallback: (rect: Rect) => void = () => {
  //
};
function onChosen(callback: (rect: Rect) => void) {
  chosenCallback = callback;
}
function userareaDown(e: MouseEvent) {
  emitEvent('desktop.background.leftClick', e);
  chosenCallback({
    left: e.clientX,
    top: e.clientY,
    width: 0,
    height: 0,
  });
}
function backgroundDown(e: MouseEvent) {
  choseStart(e);
  addEventListener('mousemove', backgroundMove);
  addEventListener('mouseup', backgroundUp);
}
function backgroundMove(e: MouseEvent) {
  emitEvent('desktop.background.leftMove', e);
  chosing(e);
  const rectValue = getRect();
  if (rectValue) {
    chosenCallback(rectValue);
  }
}
function backgroundUp(e: MouseEvent) {
  emitEvent('desktop.background.leftUp', e);
  choseEnd();
  const rectValue = getRect();
  if (rectValue) {
    chosenCallback(rectValue);
    emitEvent('desktop.background.rectChosen', rectValue);
  }
  removeEventListener('mousemove', backgroundMove);
  removeEventListener('mouseup', backgroundUp);
}

function handleRightClick(e: MouseEvent) {
  e.preventDefault();
  createDesktopContextMenu(e, `${system._options.userLocation}Desktop`, () => {
    system.refershApp();
  });
}

onErrorCaptured((err) => {
  system.emitError(err.message.toString());
});
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
@/packages/kernel/system@/packages/kernel/event
