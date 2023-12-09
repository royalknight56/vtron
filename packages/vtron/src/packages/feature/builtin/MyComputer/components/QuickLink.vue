<template>
  <div class="file-item mode-list" v-for="item in quickLinks" :key="item.path" @click="quick(item)">
    <div class="file-item_img">
      <img :src="item.img" alt="" />
    </div>
    <div class="file-item_title">
      {{ item.name }}
    </div>
  </div>
</template>
<script setup lang="ts">
import imageicon from '@packages/assets/image.png';
import foldericon from '@packages/assets/folder.png';
import audioicon from '@packages/assets/audio.png';

const props = defineProps({
  onOpen: {
    type: Function,
    default: () => {
      //
    },
  },
});
const quickLinks = [
  {
    img: foldericon,
    name: '笔记',
    path: '/C/Users/Note',
  },
  {
    img: imageicon,
    name: '图片',
    path: '/C/Users/Photo',
  },
  {
    img: audioicon,
    name: '音乐',
    path: '/C/Users/Music',
  },
];
function quick(item: any) {
  console.log(item);
  props.onOpen(item.path);
}
</script>
<style lang="scss" scoped>
.file-item {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  color: var(--icon-title-color);

  font-size: var(--ui-font-size);
  border: 1px solid transparent;
  margin: 2px;
  user-select: none;
}
.file-item:hover {
  background-color: #b1f1ff4c;
}

.mode-list {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  height: calc(0.8 * var(--menulist-item-height));
  width: 100%;

  .file-item_img {
    width: var(--menulist-item-height);
    height: calc(0.6 * var(--menulist-item-height));
    // margin: 0px auto;
    user-select: none;
    flex-shrink: 0;
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
  .file-item_title {
    height: min-content;

    word-break: break-all;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
}
</style>
