<template>
  <div
    class="item-group"
    v-for="(item, index) in fileList"
    :key="item.path + item.isOpen"
  >
    <div
      class="file-item"
      :class="{
        chosen: chosenPath === item.path,
        // 'no-chosen': !chosenIndexs.includes(index),
        'mode-icon': mode === 'icon',
        'mode-list': mode === 'list',
      }"
      :style="{
        ...styleProps,
        'padding-left': level * 12 + 'px',
      }"
      @click="handleClick(item, index)"
      @mousedown.stop
    >
      <div
        class="iconfont icon-arrow-down"
        :class="{
          'open-arrow': item.isOpen,
          'hide-arrow':
            (item.isOpen && !item.subFileList?.length) || !item.isDirectory,
        }"
        @click.stop="onOpenArrow(item)"
      ></div>
      <span
        v-if="isEdit !== item.path"
        class="file-item_title"
        @dblclick="dbclick(item)"
        >{{ dealI18nName(basename(item.path)) }}</span
      >
      <input
        v-else
        class="file-item_title"
        v-model="renameStr"
        @blur="endRename(item)"
        @keyup.enter="endRename(item)"
      />
    </div>
    <div class="sub-tree">
      <FileTree
        v-if="item.isOpen"
        :level="level + 1"
        mode="list"
        :chosen-path="chosenPath"
        :on-open="onSubOpen"
        :file-list="item.subFileList"
      >
      </FileTree>
    </div>
  </div>
</template>
<script lang="ts" setup>
import {
  VtronFile,
  useSystem,
  basename,
  join,
  VtronFileWithoutContent,
} from "vtron";
import { onMounted, ref } from "vue";

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

  chosenPath: {
    type: String,
    default: "",
  },
  fileList: {
    type: Array<FileWithOpen>,
    default: () => [],
  },

  mode: {
    type: String,
    default: "icon",
  },
  styleProps: {
    type: Object,
    default: () => {
      //
    },
  },
});
const chosenIndexs = ref<Array<number>>([]);
function handleClick(item: FileWithOpen, index: number) {
  chosenIndexs.value = [index];
  props.onOpen(item.path, item.isDirectory);
}

onMounted(() => {
  chosenIndexs.value = [];
  props.fileList.forEach((item) => {
    item.isOpen = false;
  });
});

function onSubOpen(path?: string, isDirectory?: boolean) {
  props.onOpen(path, isDirectory);
}

// 重命名
const isEdit = ref("-1");
const renameStr = ref("");
function dbclick(item: FileWithOpen) {
  // if (!item.isDirectory) {
  renameStr.value = basename(item.path);
  isEdit.value = item.path;
  // }
}

function endRename(item: FileWithOpen) {
  if (isEdit.value === item.path) {
    isEdit.value = "-1";
    sys.fs
      .rename(item.path, join(item.parentPath, renameStr.value))
      .then((res) => {
        props.onOpen();
      });
  }
}

async function onSubRefresh(item: FileWithOpen) {
  item.subFileList = await sys.fs.readdir(item.path);
}

async function onOpenArrow(item: FileWithOpen) {
  if (item.isOpen && !item.subFileList?.length) {
    return;
  }
  item.isOpen = !item.isOpen;

  item.subFileList = await sys.fs.readdir(item.path);
}

function dealI18nName(name: string) {
  return name;
}
</script>
<style scoped>
.icon-arrow-down {
  display: block;
  width: 4px;
  height: 4px;
  transform: translateY(0px) rotate(-45deg);
  border: 2px solid rgba(0, 0, 0, 0.465);
  border-left: none;
  border-top: none;
  transition: all 0.1s;
}
.icon-arrow-down::after {
  content: "";
  display: block;
  width: 9px;
  height: 9px;
}
.hide-arrow {
  border-color: transparent;
}
.open-arrow {
  transform: translateY(-2px) translateX(2px) rotate(45deg);
}

.file-item {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  font-size: var(--ui-font-size);
  border: 1px solid transparent;
  margin: 2px;
  user-select: none;
}

.file-item_title {
  margin-left: 4px;
  width: 100%;
  height: 100%;
}
.file-item:hover {
  background-color: #b1f1ff4c;
}
.chosen {
  border: 1px dashed #3bdbff3d;
  background-color: #9595956b;
}
.chosen:hover {
  background-color: #9595956b;
}
.no-chosen .file-item_title {
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.mode-icon .file-item_img {
  width: 60%;
  height: calc(0.6 * var(--desk-item-size));
  margin: 0px auto;
  user-select: none;
  flex-shrink: 0;
}
.mode-icon .file-item_title {
  height: calc(0.4 * var(--desk-item-size));
  display: block;
  text-align: center;
  word-break: break-all;
  flex-grow: 0;
}
.mode-list {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  height: calc(0.8 * var(--menulist-item-height));
  width: 100%;
}

.mode-list .file-item_img {
  width: var(--menulist-item-height);
  height: calc(0.6 * var(--menulist-item-height));

  user-select: none;
}
.mode-list .file-item_title {
  height: min-content;
  outline: none;
  display: flex;
  align-items: center;

  word-break: break-all;
}
</style>
