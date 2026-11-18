<template>
  <div
    :style="{
      top: y + 'px',
      left: x + 'px',
    }"
    class="contextmenu"
    v-if="rootState.contextMenu"
  >
    <div class="contextmenu-item" v-for="(item, index) in menuList" :key="item.label">
      <div class="option-title" @click="handleClick(item)">{{ item.label }}</div>
      <div class="icon-arrow" v-if="item.submenu?.length"></div>
      <div class="children-item" v-if="item.submenu?.length"
        :class="{ 'opens-left': opensLeft }"
        :style="{ top: submenuTop(index, item.submenu.length) + 'px' }">
        <div class="contextmenu-item" v-for="citem in item.submenu" :key="citem.label">
          <div class="option-title" @click="handleClick(citem)">{{ citem.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { inject, ref, watch } from 'vue';
import { System } from '@packages/kernel';
import type { MenuItem } from '@packages/services';

const x = ref(-100);
const y = ref(-100);
const opensLeft = ref(false);
const menuList = ref<MenuItem[]>([]);
const sys = inject<System>('system')!;
const rootState = sys.stateManager;
watch(
  () => rootState.contextMenu.current.value,
  (contextMenu) => {
    if (!contextMenu) {
      x.value = -1000;
      y.value = -1000;
      menuList.value = [];
      return;
    }

    // get window inner width and height
    const { width: innerWidth, height: innerHeight } = rootState.rect.getScreenSize();
    // get contextmenu width
    const contextmenuWidth = 160;
    // get contextmenu height
    const contextmenuHeight = 24 * (contextMenu?.items.length || 0);
    // get mouse position
    const outer = sys?.rootRef;
    const outerRect = outer?.getBoundingClientRect();
    const mouseX = (contextMenu?._mouse?.clientX ?? 0) - (outerRect?.x ?? 0);
    const mouseY = (contextMenu?._mouse?.clientY ?? 0) - (outerRect?.y ?? 0);
    // get contextmenu position
    const contextmenuX = mouseX + contextmenuWidth > innerWidth ? mouseX - contextmenuWidth : mouseX;
    const contextmenuY = mouseY + contextmenuHeight > innerHeight ? mouseY - contextmenuHeight : mouseY;

    opensLeft.value = contextmenuX + 2 * contextmenuWidth > innerWidth && contextmenuX >= contextmenuWidth;
    x.value = contextmenuX;
    y.value = contextmenuY;
    menuList.value = contextMenu?.items || [];
  }
);

sys.mountEvent('contextMenu.hidden', () => {
  sys.stateManager.contextMenu.setContextMenu(null);
});

function submenuTop(index: number, count: number) {
  const itemTop = y.value + 3 + index * 24;
  const remaining = rootState.rect.getScreenSize().height - itemTop;
  return Math.max(-itemTop, Math.min(0, remaining - (count * 24 + 6)));
}

function handleClick(item: MenuItem) {
  if (item?.click) {
    item?.click?.();
    sys.emitEvent('contextMenu.hidden');
  }
}
</script>
<style lang="scss" scoped>
.contextmenu {
  position: absolute;
  top: 0px;
  left: 0px;
  width: var(--contextmenu-width);
  z-index: 100;
  background-color: #eeeeee;
  border: 1px solid #909090;
  padding: 2px 0px;
  user-select: none;

  .contextmenu-item {
    position: relative;
    height: var(--ui-list-item-height);
    font-size: var(--ui-font-size);
    padding: 2px 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .option-title {
      width: 100%;
    }
    .children-item {
      display: none;
      position: absolute;
      left: calc(100% - 1px);
      width: var(--contextmenu-width);
      z-index: 100;
      background-color: #eeeeee;
      border: 1px solid #909090;
      padding: 2px 0px;
      user-select: none;
    }

    .children-item.opens-left { left: auto; right: calc(100% - 1px); }

    &:hover {
      background-color: #fefefe;
      .children-item {
        display: block;
      }
    }
  }
}

.icon-arrow {
  display: block;
  width: 4px;
  height: 4px;
  transform: translateY(0px) rotate(-45deg);
  border: 2px solid rgba(0, 0, 0, 0.465);
  border-left: none;
  border-top: none;
  transition: all 0.1s;
}
</style>
