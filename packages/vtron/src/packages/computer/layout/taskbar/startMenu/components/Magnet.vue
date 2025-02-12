<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="magnet-group scroll-bar">
    <div
      @click.stop="handle(item)"
      @dragstart="dragStart($event, index)"
      @dragover.prevent
      @drop="drop($event, index)"
      class="magnet-item"
      draggable="true"
      :style="{
        animationDelay: `${Math.floor(index / 4) * 0.02}s`,
        animationDuration: `${Math.floor(index / 4) * 0.04 + 0.1}s`,
      }"
      v-for="(item, index) in localAppList"
      v-glowing
      :key="basename(item.path)"
    >
      <FileIcon class="magnet-item_img" :file="item" />
      <span class="magnet-item_title">{{ basename(item.path) }}</span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useAppOpen } from '@/packages/computer/hook/useAppOpen';
import { System } from '@packages/kernel';
import { basename } from '@packages/kernel';
import FileIcon from '@/packages/computer/application/FileIcon.vue';
import { VtronFileWithoutContent } from '@packages/kernel';
import { vGlowing } from '@/packages/computer/utils/glowingBorder';
import { inject, ref, watch } from 'vue';

const sys = inject<System>('system')!;
const { openapp, appList } = useAppOpen('magnet', sys);
const localAppList = ref([...appList]);

// 监听原始appList的变化
watch(
  () => appList,
  (newList) => {
    localAppList.value = [...newList];
  },
  { deep: true }
);

// 添加拖拽相关的状态和方法
let draggedItem: number | null = null;

function handle(item: VtronFileWithoutContent) {
  sys.emitEvent('magnet.item.click', item);
  openapp(item);
}

function dragStart(event: DragEvent, index: number) {
  draggedItem = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

function drop(event: DragEvent, dropIndex: number) {
  event.preventDefault();
  if (draggedItem === null || draggedItem === dropIndex) return;

  const items = [...localAppList.value];
  const [removed] = items.splice(draggedItem, 1);
  items.splice(dropIndex, 0, removed);

  localAppList.value = items;
  sys.stateManager.appList.magnet = items;

  draggedItem = null;
}
</script>
<style lang="scss" scoped>
@import '@packages/assets/main.scss';

.magnet-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, var(--magnet-item-size));
  grid-auto-flow: row dense;
  grid-gap: 4px;
  align-content: start;
  justify-content: start;
  height: 100%;
  width: var(--magnet-width);
  user-select: none;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 10px;
  padding-left: 10px;

  .magnet-item {
    width: var(--magnet-item-size);
    height: var(--magnet-item-size);
    font-size: var(--ui-font-size);
    background-color: #f2f2f252;
    border: 1px solid;
    border-color: var(--color-gray-hover);
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    will-change: transform;
    transition: all 0.2s;
    animation: transin both;
    position: relative;
    overflow: hidden;

    &:hover {
      background-color: #f2f2f270;
      transform: scale(1.02);
    }

    &:active {
      transform: scale(0.98);
    }

    .magnet-item_img {
      width: 40%;
      height: 40%;
      margin: 4px auto;
      flex-shrink: 0;
    }

    .magnet-item_title {
      // height: 40%;
      // display: block;
      text-align: center;
      // 最多两行，超过两行显示省略号
      overflow: hidden;
      word-break: break-all;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
  }
  @keyframes transin {
    from {
      transform: translateY(40px);
    }
    to {
      transform: translateY(0px);
    }
  }
}
</style>
