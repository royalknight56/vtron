<template>
  <div class="magnet-group scroll-bar">
    <div
      @click.stop="handle(item)"
      class="magnet-item"
      :style="{
        animationDelay: `${Math.floor(index / 4) * 0.02}s`,
        animationDuration: `${Math.floor(index / 4) * 0.04 + 0.1}s`,
      }"
      v-for="(item, index) in appList"
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
import { emitEvent, System } from '@packages/kernel';
import { basename } from '@packages/kernel';
import FileIcon from '@packages/application/FileIcon.vue';
import { VtronFileWithoutContent } from '@packages/kernel';
import { vGlowing } from '@/packages/util/glowingBorder';
import { inject } from 'vue';

const sys = inject<System>('system')!;
const { openapp, appList } = useAppOpen('magnet', sys);
function handle(item: VtronFileWithoutContent) {
  emitEvent('magnet.item.click', item);
  openapp(item);
}
</script>
<style lang="scss" scoped>
@import '@packages/assets/main.scss';

.magnet-group {
  display: flex;
  flex-direction: row;
  align-content: flex-start;
  flex-wrap: wrap;
  height: 100%;
  width: var(--magnet-width);
  user-select: none;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 10px;
  padding-left: 10px;
  gap: 4px;

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
