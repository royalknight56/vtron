<template>
  <div
    class="desktop"
    @dragenter.prevent
    @dragover.prevent
    @drop="dragFileToDrop($event, `${sys._options.userLocation}Desktop`)"
  >
    <div class="userarea" @contextmenu.stop="handleRightClick" @mousedown="userareaDown">
      <div @mousedown="backgroundDown">
        <!-- <DesktopWindow> </DesktopWindow> -->
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
import DeskItem from './desktop/components/DeskItem.vue';
import Taskbar from './taskbar/Taskbar.vue';
import DesktopBackground from './desktop/components/DesktopBackground.vue';
import { System } from '@packages/kernel';
import WindowGroup from './windowGroup/WindowGroup.vue';
import ContextMenu from './contextMenu/ContextMenu.vue';
import NotificationGroup from './notifyGroup/NotifyGroup.vue';
import MessageCenterPop from './taskbar/popover/MessageCenterPop.vue';
import { useFileDrag } from '@/packages/computer/hook/useFileDrag';
import { Rect, useRectChosen } from '@/packages/computer/hook/useRectChosen';
import { inject, onErrorCaptured, onMounted } from 'vue';
import { createDesktopContextMenu } from '@/packages/computer/utils/createContextMenu';
import { initComputer } from '../mount';

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
  sys.emitEvent('desktop.background.leftClick', e);
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
  sys.emitEvent('desktop.background.leftMove', e);
  chosing(e);
  const rectValue = getRect();
  if (rectValue) {
    chosenCallback(rectValue);
  }
}
function backgroundUp(e: MouseEvent) {
  sys.emitEvent('desktop.background.leftUp', e);
  choseEnd();
  const rectValue = getRect();
  if (rectValue) {
    chosenCallback(rectValue);
    sys.emitEvent('desktop.background.rectChosen', rectValue);
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
onMounted(() => {
  initComputer(sys);
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
