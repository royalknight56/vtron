<template>
  <div
    :style="{
      top: y + 'px',
      left: x + 'px',
    }"
    class="contextmenu"
    v-show="isVisiable"
  >
    <div class="contextmenu-item" v-for="item in menuList" :key="item.name">
      <div class="option-title" @click="handleClick(item)">{{ item.name }}</div>
      <div class="icon-arrow" v-if="item.children?.length"></div>
      <div class="children-item" v-if="item.children?.length">
        <div class="contextmenu-item" v-for="citem in item.children" :key="citem.name">
          <div class="option-title" @click="handleClick(citem)">{{ citem.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { mountEvent, emitEvent } from '@feature/event';
import { useSystem } from '@feature/system';
import { ContextMenu } from '@/packages/hook/useContextMenu';
const isVisiable = ref(false);
const x = ref(0);
const y = ref(0);
const menuList = ref<ContextMenu[]>([]);
mountEvent('contextMenu.show', (source, data) => {
  if (!data.menuList || data.menuList?.length === 0) {
    return;
  }
  isVisiable.value = true;
  // get window inner width and height
  const innerWidth = useSystem()._rootState.system.info.screenWidth;
  const innerHeight = useSystem()._rootState.system.info.screenHeight;
  // get contextmenu width
  const contextmenuWidth = 160;
  // get contextmenu height
  const contextmenuHeight = 24 * data.menuList.length;
  // get mouse position
  const outer = useSystem()?.ref;
  const mouseX = data.mouse.x - (outer?.offsetLeft || 0);
  const mouseY = data.mouse.y - (outer?.offsetTop || 0);

  // get contextmenu position
  const contextmenuX = mouseX + contextmenuWidth > innerWidth ? mouseX - contextmenuWidth : mouseX;
  const contextmenuY = mouseY + contextmenuHeight > innerHeight ? mouseY - contextmenuHeight : mouseY;

  x.value = contextmenuX;
  y.value = contextmenuY;
  menuList.value = data.menuList;
});
mountEvent('contextMenu.hidden', () => {
  isVisiable.value = false;
});

function handleClick(item: { name: string; click: () => void }) {
  if (item?.click) {
    item?.click?.();
    emitEvent('contextMenu.hidden');
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
      left: var(--contextmenu-width);
      width: var(--contextmenu-width);
      z-index: 100;
      background-color: #eeeeee;
      border: 1px solid #909090;
      padding: 2px 0px;
      user-select: none;
    }

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
