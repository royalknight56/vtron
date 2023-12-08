<template>
  <div class="state-item" v-for="item in traylst" :key="item.image">
    <div class="inner" @click="handleClick(item)">
      <VtronImage :path="item.image"></VtronImage>
    </div>
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
  z-index: 10;

  // width: 100%;
  background-color: #fff;

  width: 100%;
  height: 100%;
  // background-color: rgb(255, 255, 255);
  overflow: hidden;
  contain: content;
}
</style>
