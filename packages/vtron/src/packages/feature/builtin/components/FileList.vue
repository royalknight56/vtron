<template>
  <template v-if="mode === 'detail'">
    <div class="file-item file-bar mode-detail">
      <div class="file-item_img"></div>
      <div class="file-item_title"></div>
      <div class="file-item_type">
        <span>{{ i18n('size') }}</span>
      </div>
      <div class="file-item_type">
        <span>{{ i18n('creation.time') }}</span>
      </div>
      <div class="file-item_type">
        <span>{{ i18n('modification.time') }}</span>
      </div>
      <div class="file-item_type">
        <span>{{ i18n('permission') }}</span>
      </div>
    </div>
  </template>
  <div
    draggable="true"
    class="file-item"
    :class="{
      chosen: chosenIndexs.includes(index),
      'no-chosen': !chosenIndexs.includes(index),
      'mode-icon': mode === 'icon',
      'mode-list': mode === 'list',
      'mode-big': mode === 'big',
      'mode-middle': mode === 'middle',
      'mode-detail': mode === 'detail',
      'drag-over': hoverIndex === index,
    }"
    :style="{
      '--theme-color': theme === 'light' ? '#ffffff6b' : '#3bdbff3d',
    }"
    v-for="(item, index) in fileList"
    :key="item.path"
    @dblclick="handleOnOpen(item)"
    @touchstart.passive="doubleTouch($event, item)"
    @contextmenu.stop.prevent="handleRightClick($event, item, index)"
    @drop="hadnleDrop($event, item.path)"
    @dragenter.prevent="handleDragEnter($event, item, index)"
    @dragover.prevent
    @dragleave="handleDragLeave()"
    @dragstart.stop="startDragApp($event, item)"
    @click="handleClick(index)"
    @mousedown.stop
    :ref="
      (ref) => {
        if (ref) {
          appPositions[index] = markRaw(ref as Element);
        }
      }
    "
  >
    <div class="file-item_img">
      <FileIcon :file="item" />
    </div>
    <span v-if="editIndex !== index" class="file-item_title">
      {{ dealI18nName(basename(item.path)) }}
    </span>
    <textarea
      autofocus
      draggable="false"
      @dragover.stop
      @dragstart.stop
      @dragenter.stop
      @mousedown.stop
      @dblclick.stop
      @click.stop
      @blur="onEditNameEnd"
      v-if="editIndex === index"
      class="file-item_title file-item_editing"
      v-model="editName"
    ></textarea>
    <template v-if="mode === 'detail'">
      <div class="file-item_type">
        <span>{{ item.isDirectory ? '-' : dealSize(item.size) }}</span>
      </div>
      <div class="file-item_type">
        <span>{{ item.birthtime.toLocaleString() }}</span>
      </div>
      <div class="file-item_type">
        <span>{{ item.mtime.toLocaleString() }}</span>
      </div>
      <div class="file-item_type">
        <span>{{ item.mode?.toString?.(8) || 'unknow' }}</span>
      </div>
    </template>
  </div>
</template>
<script lang="ts" setup>
import { useSystem } from '@packages/plug';
import { emitEvent, mountEvent } from '@feature/event';
import FileIcon from '@feature/builtin/FileIcon.vue';
import { useContextMenu } from '@packages/hook/useContextMenu';
import { basename, dirname, join } from '@feature/core/Path';
import { VtronFileWithoutContent } from '@feature/core/FileSystem';
import { i18n } from '@feature/i18n';
import { useFileDrag } from '@packages/hook/useFileDrag';
import { onMounted, ref, markRaw } from 'vue';
import { Rect } from '@/packages/hook/useRectChosen';
import { throttle } from '@/packages/util/debounce';
import { dealSize } from '@/packages/util/file';
import { Menu } from '@feature/menu/Menu';
const { openPropsWindow, copyFile, createLink, openWith } = useContextMenu();
const sys = useSystem();
const { startDrag, folderDrop } = useFileDrag(sys);
const props = defineProps({
  onChosen: {
    type: Function,
    required: true,
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
  fileList: {
    type: Array<VtronFileWithoutContent>,
    default: () => [],
  },
  theme: {
    type: String || Object,
    default: 'light',
  },
  mode: {
    type: String,
    default: 'icon',
  },
});
function handleOnOpen(item: VtronFileWithoutContent) {
  chosenIndexs.value = [];
  props.onOpen(item);
  emitEvent('desktop.app.open');
}
function hadnleDrop(mouse: DragEvent, path: string) {
  hoverIndex.value = -1;
  folderDrop(mouse, path);
  chosenIndexs.value = [];
}
let expired: number | null = null;
function doubleTouch(e: TouchEvent, item: VtronFileWithoutContent) {
  if (e.touches.length === 1) {
    if (!expired) {
      expired = e.timeStamp + 400;
    } else if (e.timeStamp <= expired) {
      // remove the default of this event ( Zoom )
      handleOnOpen(item);
      e.preventDefault();
      // then reset the variable for other "double Touches" event
      expired = null;
    } else {
      // if the second touch was expired, make it as it's the first
      expired = e.timeStamp + 400;
    }
  }
}

const editIndex = ref<number>(-1);
const editName = ref<string>('');
function onEditNameEnd() {
  const editEndName = editName.value.trim();
  if (editEndName && editIndex.value >= 0) {
    sys?.fs.rename(
      props.fileList[editIndex.value].path,
      join(dirname(props.fileList[editIndex.value].path), editEndName)
    );
    props.onRefresh();
  }
  editIndex.value = -1;
}
mountEvent('edit.end', () => {
  onEditNameEnd();
});

const hoverIndex = ref<number>(-1);
const appPositions = ref<Array<Element>>([]);

const chosenIndexs = ref<Array<number>>([]);
function handleClick(index: number) {
  chosenIndexs.value = [index];
}
onMounted(() => {
  chosenIndexs.value = [];
  props.onChosen(
    throttle((rect: Rect) => {
      const tempChosen: number[] = [];
      appPositions.value.forEach((el, index) => {
        const rect2 = el.getBoundingClientRect();
        const rect2Center = {
          x: rect2.left + rect2.width / 2,
          y: rect2.top + rect2.height / 2,
        };
        if (
          rect2Center.x > rect.left &&
          rect2Center.x < rect.left + rect.width &&
          rect2Center.y > rect.top &&
          rect2Center.y < rect.top + rect.height
        ) {
          tempChosen.push(index);
        }
      });
      chosenIndexs.value = tempChosen;
    }, 100)
  );
});

function startDragApp(mouse: DragEvent, item: VtronFileWithoutContent) {
  if (chosenIndexs.value.length) {
    startDrag(
      mouse,
      chosenIndexs.value.map((index) => {
        return props.fileList[index];
      }),
      () => {
        chosenIndexs.value = [];
      }
    );
  } else {
    startDrag(mouse, [item], () => {
      chosenIndexs.value = [];
    });
  }
}

function handleRightClick(mouse: MouseEvent, item: VtronFileWithoutContent, index: number) {
  if (chosenIndexs.value.length <= 1) {
    chosenIndexs.value = [props.fileList.findIndex((app) => app.path === item.path)];
  }
  Menu.buildFromTemplate([
    {
      label: i18n('open'),
      click: () => {
        chosenIndexs.value = [];
        props.onOpen(item);
      },
    },
    {
      label: i18n('props'),
      click: () => {
        chosenIndexs.value.forEach((index) => {
          openPropsWindow(props.fileList[index].path);
          chosenIndexs.value = [];
        });
      },
    },
    {
      label: i18n('open.with'),
      click: () => {
        chosenIndexs.value = [];
        openWith(item);
      },
    },
    {
      label: i18n('copy'),
      click: () => {
        copyFile(chosenIndexs.value.map((index) => props.fileList[index]));
        chosenIndexs.value = [];
      },
    },
    {
      label: i18n('rename'),
      click: () => {
        editIndex.value = index;
        editName.value = basename(item.path);
        chosenIndexs.value = [];
      },
    },

    {
      label: i18n('create.shortcut'),
      click: () => {
        createLink(item.path)?.then(() => {
          chosenIndexs.value = [];
          props.onRefresh();
        });
      },
    },

    {
      label: i18n('delete'),
      click: async () => {
        await Promise.all(
          chosenIndexs.value.map((index) => {
            const item = props.fileList[index];
            if (item.isDirectory) {
              return sys?.fs.rmdir(item.path);
            } else {
              return sys?.fs.unlink(item.path);
            }
          })
        );
        chosenIndexs.value = [];
        props.onRefresh();
      },
    },
  ]).popup(mouse);
}

function handleDragEnter(mouse: DragEvent, item: VtronFileWithoutContent, index: number) {
  hoverIndex.value = index;
}

function handleDragLeave() {
  hoverIndex.value = -1;
}

function dealI18nName(name: string) {
  return name;
}
</script>
<style lang="scss" scoped>
.file-item {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: var(--desk-item-size);
  height: var(--desk-item-size);
  font-size: var(--ui-font-size);
  color: var(--icon-title-color);
  padding-top: 4px;
  border: 1px solid transparent;
  margin: 6px;
  .file-item_img {
    width: 60%;
    height: 60%;
    pointer-events: none;
  }
  .file-item_type {
    display: none;
  }
  .file-item_title {
    pointer-events: none;
  }
  .file-item_editing {
    display: inline-block !important;
    outline: none;
    pointer-events: all;
    padding: 0;
    margin: 0;
    min-width: 0;
    height: min-content !important;
    width: min-content !important;
    resize: none;
    border-radius: 0;
  }
}

.file-item:hover {
  background-color: #b1f1ff4c;
}
.chosen {
  border: 1px dashed #3bdbff3d;
  // background-color: #ffffff6b;
  background-color: var(--theme-color);
  .file-item_title {
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}
.no-chosen {
  .file-item_title {
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}
.drag-over {
  border: 1px dashed #3bdbff3d;
  // background-color: #ffffff6b;
  background-color: var(--theme-color);
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
    // height: calc(0.4 * var(--desk-item-size));
    // display: block;
    text-align: center;
    word-break: break-all;
    flex-grow: 0;
  }
}

.mode-list {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  height: var(--menulist-item-height);
  width: var(--menulist-width);

  .file-item_img {
    width: var(--menulist-item-height);
    height: calc(0.6 * var(--menulist-item-height));

    flex-shrink: 0;
    user-select: none;
  }

  .file-item_title {
    height: min-content;
    word-break: break-all;
  }
}
.mode-icon {
  width: var(--desk-item-size);
  height: var(--desk-item-size);
}
.mode-big {
  width: calc(var(--desk-item-size) * 2.5);
  height: calc(var(--desk-item-size) * 2.5);
}
.mode-middle {
  width: calc(var(--desk-item-size) * 1.5);
  height: calc(var(--desk-item-size) * 1.5);
}
.mode-detail {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  height: var(--menulist-item-height);
  width: 100%;
  margin: 2px;
  .file-item_img {
    width: 30px;
  }
  .file-item_title {
    width: 40%;
    display: flex;
    align-items: center;
    word-break: break-all;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .file-item_type {
    display: block;
    color: var(--color-dark-hover);
    width: 20%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.file-bar:hover {
  background-color: unset;
  user-select: none;
}
</style>
