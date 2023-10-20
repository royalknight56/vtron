<template>
  <div class="magnet-group scroll-bar">
    <div
      @click.stop="handle(item)"
      class="magnet-item"
      v-for="(item, index) in appList"
      :key="basename(item.path)"
      :style="{
        animationDelay: `${index * 0.01}s`,
        animationDuration: `${index * 0.01 + 0.1}s`,
      }"
    >
      <FileIcon class="magnet-item_img" :file="item" />
      <span class="magnet-item_title">{{ basename(item.path) }}</span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useAppOpen } from '@packages/hook/useAppOpen';
import { emitEvent } from '@feature/event';
import { basename } from '@feature/core/Path';
import FileIcon from '@feature/builtin/FileIcon.vue';
import { VtronFile } from '@feature/core/fileSystem';

const { openapp, appList } = useAppOpen('menulist');
function handle(item: VtronFile) {
  emitEvent('menulist.item.click', item);
  openapp(item);
}
</script>
<style lang="scss" scoped>
@import '@packages/assets/main.scss';

.magnet-group {
  display: flex;
  flex-direction: column;
  height: 100%;
  user-select: none;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 10px;

  .magnet-item {
    width: var(--menulist-width);
    height: var(--menulist-item-height);
    font-size: var(--ui-font-size);
    padding: 2px 6px;
    display: flex;
    align-items: center;
    animation: transin 0.2s both;
    // margin-left: 10px;

    .magnet-item_img {
      height: 80%;
      width: 20%;
      // margin: 4px;
    }

    .magnet-item_title {
      display: block;
      text-align: center;
      margin-left: 10px;
    }
  }

  @keyframes transin {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0px);
    }
  }

  .magnet-item:hover {
    background-color: var(--color-gray-hover-light);
  }
}
</style>
@/packages/feature/core/FileSystem
