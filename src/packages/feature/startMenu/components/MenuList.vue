<template>
  <div class="magnet-group scroll-bar">
    <div @click.stop="handle(item)" class="magnet-item" v-for="item in appList" :key="basename(item.path)">
      <FileIcon class="magnet-item_img" :file="item" />
      <span class="magnet-item_title">{{ basename(item.path) }}</span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useAppOpen } from '@packages/hook/useAppOpen';
import { emitEvent } from '../../event';
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
  padding-top: 30px;

  .magnet-item {
    width: var(--menulist-width);
    height: var(--menulist-item-height);
    font-size: var(--ui-font-size);
    padding: 6px;
    display: flex;
    align-items: center;
    margin-left: 10px;

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

  .magnet-item:hover {
    background-color: var(--color-gray-hover);
  }
}
</style>
