<template>
  <div
    class="desktop"
    @dragenter.prevent
    @dragover.prevent
    @drop="dragFileToDrop($event, `${sys._options.userLocation}Desktop`)"
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
import DeskItem from './components/DeskItem.vue';
import Taskbar from '@packages/ui/taskbar/Taskbar.vue';
import DesktopBackground from '@packages/ui/desktop/components/DesktopBackground.vue';
import { emitEvent, System } from '@packages/kernel';
import WindowGroup from '@/packages/ui/windowGroup/WindowGroup.vue';
import ContextMenu from '@/packages/computer/layout/contextMenu/ContextMenu.vue';
import NotificationGroup from '@/packages/ui/notifyGroup/NotifyGroup.vue';
import MessageCenterPop from '@packages/ui/taskbar/popover/MessageCenterPop.vue';
import { useFileDrag } from '@/packages/computer/hook/useFileDrag';
import { Rect, useRectChosen } from '@/packages/computer/hook/useRectChosen';
import { inject, onErrorCaptured } from 'vue';
import { createDesktopContextMenu } from '@/packages/ui/utils/createContextMenu';

const { choseStart, chosing, choseEnd, getRect, Chosen } = useRectChosen();
const sys = inject<System>('system')!;

const { dragFileToDrop } = useFileDrag(sys);

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
  createDesktopContextMenu(sys, e, `${sys._options.userLocation}Desktop`, () => {
    sys.refershApp();
  });
}

onErrorCaptured((err) => {
  sys.emitError(err.message.toString());
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
