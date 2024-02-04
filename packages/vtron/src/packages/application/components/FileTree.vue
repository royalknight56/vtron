<template>
  <div class="item-group" v-for="(item, index) in fileList" :key="item.path + item.isOpen">
    <div
      class="file-item"
      :class="{
        chosen: chosenPath === item.path,
        // 'no-chosen': !chosenIndexs.includes(index),
        'mode-icon': mode === 'icon',
        'mode-list': mode === 'list',
      }"
      :style="{
        'padding-left': level * 12 + 'px',
      }"
      @click="handleClick(item, index)"
      @mousedown.stop
    >
      <div
        class="iconfont"
        :class="{ 'open-arrow': item.isOpen, 'hide-arrow': item.isOpen && !item.subFileList?.length }"
        @click.stop="onOpenArrow(item)"
      >
        <div class="icon-arrow-down"></div>
      </div>
      <div class="file-item_img">
        <FileIcon :file="item" />
      </div>
      <span class="file-item_title">{{ dealI18nName(basename(item.path)) }}</span>
    </div>
    <div class="sub-tree">
      <FileTree
        v-if="item.isOpen"
        :level="level + 1"
        mode="list"
        :chosen-path="chosenPath"
        :on-refresh="() => onSubRefresh(item)"
        :on-open="onSubOpen"
        :file-list="item.subFileList"
      >
      </FileTree>
    </div>
  </div>
</template>
<script lang="ts" setup>
import FileIcon from '@packages/application/FileIcon.vue';
import { VtronFileWithoutContent, basename, useSystem } from '@packages/kernel';
import { onMounted, ref } from 'vue';

const sys = useSystem();
type FileWithOpen = VtronFileWithoutContent & {
  isOpen?: boolean;
  subFileList?: FileWithOpen[];
};
const props = defineProps({
  level: {
    type: Number,
    default: 0,
  },
  onOpen: {
    type: Function,
    default: () => {
      //
    },
  },
  onRefresh: {
    type: Function,
    default: () => {
      //
    },
  },
  chosenPath: {
    type: String,
    default: '',
  },
  fileList: {
    type: Array<FileWithOpen>,
    default: () => [],
  },

  mode: {
    type: String,
    default: 'icon',
  },
});
const chosenIndexs = ref<Array<number>>([]);
function handleClick(item: FileWithOpen, index: number) {
  chosenIndexs.value = [index];
  props.onOpen(item.path);
}

onMounted(() => {
  chosenIndexs.value = [];
  props.fileList.forEach((item) => {
    item.isOpen = false;
  });
});

function onSubOpen(path: string) {
  props.onOpen(path);
}

async function onSubRefresh(item: FileWithOpen) {
  item.subFileList = (await sys.fs.readdir(item.path)).filter((file) => {
    return file.isDirectory;
  });
}

async function onOpenArrow(item: FileWithOpen) {
  if (item.isOpen && !item.subFileList?.length) {
    return;
  }
  item.isOpen = !item.isOpen;

  item.subFileList = (await sys.fs.readdir(item.path)).filter((file) => {
    return file.isDirectory;
  });
}

function dealI18nName(name: string) {
  return name;
}
</script>
<style lang="scss" scoped>
.icon-arrow-down {
  display: block;
  width: 4px;
  height: 4px;
  margin: 7px;
  transform: translateY(0px) rotate(-45deg);
  border: 2px solid rgba(0, 0, 0, 0.465);
  border-left: none;
  border-top: none;
  transition: all 0.1s;
}
.hide-arrow {
  border-color: transparent;
}
.open-arrow {
  transform: translateY(-2px) translateX(2px) rotate(90deg);
}
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
.chosen {
  border: 1px dashed #3bdbff3d;
  background-color: #9595956b;
  .file-item_title {
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
  //   background-color: var(--theme-color);
}
.chosen:hover {
  background-color: #9595956b;
}
.no-chosen {
  .file-item_title {
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
}
.mode-icon {
  .file-item_img {
    width: 60%;
    height: calc(0.6 * var(--desk-item-size));
    margin: 0px auto;
    user-select: none;
    flex-shrink: 0;
  }

  .file-item_title {
    // color: var(--color-ui-desk-item-title);
    height: calc(0.4 * var(--desk-item-size));
    display: block;
    text-align: center;
    word-break: break-all;
    flex-grow: 0;
  }
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
@/packages/kernel/file/Path@/packages/kernel/file/FileSystem