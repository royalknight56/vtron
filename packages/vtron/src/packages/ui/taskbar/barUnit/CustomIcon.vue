<template>
  <div class="custom-outer">
    <div class="state-item" v-for="item in traylst" :key="item._id">
      <div class="state-icon" @click="($event) => handleClick(item, $event)">
        <div class="inner">
          <VtronImage v-if="typeof item.image === 'string'" :path="item.image"></VtronImage>
          <component v-else :is="item.image"></component>
        </div>
      </div>
      <Transition name="fade">
        <div
          class="context-menu"
          v-if="item._contextMenuShow"
          :style="{
            width: item._contextMenuWidth + 'px',
            height: item._contextMenuHeight + 'px',
          }"
        >
          <component :is="item._contextMenu"></component>
        </div>
      </Transition>
    </div>
  </div>
</template>
<script setup lang="ts">
import VtronImage from '@packages/application/components/VtronImage.vue';
import { emitEvent, mountEvent } from '@packages/kernel';
import { Menu } from '@packages/ui';
import { Tray } from '@packages/ui';

const traylst = Tray.trayList;

function handleClick(item: Tray, ev: MouseEvent) {
  if (item._contextMenu instanceof Menu) {
    item._contextMenu.popup(ev);
  } else {
    item._contextMenuShow = !item._contextMenuShow;
  }
  Tray.trayList.value.forEach((tray) => {
    if (tray._id !== item._id) {
      tray._contextMenuShow = false;
    }
  });
  emitEvent('tray.show', item);
}
mountEvent('tray.hidden', () => {
  Tray.trayList.value.forEach((item) => {
    item._contextMenuShow = false;
  });
});
</script>
<style lang="scss" scoped>
.custom-outer {
  display: flex;
  height: 100%;
  flex-direction: row-reverse;
  align-items: center;
}
.state-item {
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
}
.state-icon {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
}
.state-item:hover {
  background-color: rgba(255, 255, 255, 0.519);
}
.inner {
  padding: 0 8px;
  height: 60%;
  display: flex;
  align-items: center;
}
.context-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  z-index: 80;
  width: 100%;
  height: 100%;

  overflow: hidden;
  contain: content;
}

.fade-enter-active {
  transition: all 0.4s var(--aniline);
}
.fade-leave-active {
  transition: all 0.2s;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0px);
  // 裁剪
  clip-path: inset(0 0 0 0);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(30px);
  // 裁剪
  clip-path: inset(0 0 30px 0);
}
</style>
