<template>
  <div class="state-item" v-for="item in traylst" :key="item._id">
    <div class="inner" @click="handleClick(item)">
      <VtronImage :path="item.image"></VtronImage>
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
</template>
<script setup lang="ts">
import VtronImage from '@/packages/feature/builtin/components/VtronImage.vue';
import { mountEvent } from '@/packages/feature/event';
import { Tray } from '@/packages/feature/tray/Tary';

const traylst = Tray.trayList;

function handleClick(item: Tray) {
  if (item._contextMenu) {
    item._contextMenuShow = !item._contextMenuShow;
  }
  Tray.trayList.value.forEach((tray) => {
    if (tray._id !== item._id) {
      tray._contextMenuShow = false;
    }
  });
}
mountEvent('tray.hidden', () => {
  Tray.trayList.value.forEach((item) => {
    item._contextMenuShow = false;
  });
});
</script>
<style lang="scss" scoped>
.state-item {
  padding: 0 8px;
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
}
.state-item:hover {
  background-color: rgba(255, 255, 255, 0.519);
}
.inner {
  height: 60%;
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
