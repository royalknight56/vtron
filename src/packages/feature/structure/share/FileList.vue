<template>
  <div
    draggable="true"
    class="file-item"
    :class="{
      chosen: chosenIndexs.includes(index),
      'no-chosen': !chosenIndexs.includes(index),
      'mode-icon': mode === 'icon',
      'mode-list': mode === 'list',
      'drag-over': hoverIndex === index,
    }"
    :style="{
      ...styleProps,
      '--theme-color': theme === 'light' ? '#ffffff6b' : '#3bdbff3d',
    }"
    v-for="(item, index) in fileList"
    :key="item.path"
    @dblclick="onOpen(item)"
    @contextmenu.stop.prevent="handleRightClick($event, item)"
    @drop="folderDrop($event, item.path)"
    @dragenter.prevent="handleDragEnter($event, item, index)"
    @dragover.prevent
    @dragleave="handleDragLeave()"
    @dragstart.stop="startDragApp($event, item)"
    @click="handleClick(index)"
    @mousedown.stop
    :ref="
      (ref) => {
        if (ref) {
          appPositions[index] = ref as Element;
        }
      }
    "
  >
    <div class="file-item_img">
      <FileIcon :file="item" />
    </div>
    <span class="file-item_title">{{ dealI18nName(basename(item.path)) }}</span>
  </div>
</template>
<script lang="ts" setup>
import { useSystem } from '@packages/plug';
import { emitEvent } from '@feature/event';
import FileIcon from '@feature/builtin/FileIcon.vue';
import { useContextMenu } from '@packages/hook/useContextMenu';
import { basename } from '@feature/core/Path';
import { VtronFile } from '@feature/core/FileSystem';
import { i18n } from '@feature/i18n';
import { useFileDrag } from '@packages/hook/useFileDrag';
import { onMounted, ref } from 'vue';
import { Rect } from '@/packages/hook/useRectChosen';
import { throttle } from '@/packages/util/debounce';
const { openPropsWindow, copyFile } = useContextMenu();
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
    type: Array<VtronFile>,
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
  styleProps: {
    type: Object,
    default: () => {
      //
    },
  },
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

function startDragApp(mouse: DragEvent, item: VtronFile) {
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

function handleRightClick(mouse: MouseEvent, item: VtronFile) {
  if (chosenIndexs.value.length <= 1) {
    chosenIndexs.value = [props.fileList.findIndex((app) => app.path === item.path)];
  }
  emitEvent('contextMenu.show', {
    mouse: mouse,
    menuList: [
      {
        name: i18n('open'),
        click: () => {
          props.onOpen(item);
        },
      },
      {
        name: i18n('props'),
        click: () => {
          chosenIndexs.value.forEach((index) => {
            openPropsWindow(props.fileList[index].path);
          });
        },
      },
      {
        name: i18n('copy'),
        click: () => {
          copyFile(chosenIndexs.value.map((index) => props.fileList[index]));
        },
      },
      {
        name: i18n('delete'),
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
          props.onRefresh();
        },
      },
    ],
  });
}

function handleDragEnter(mouse: DragEvent, item: VtronFile, index: number) {
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
  justify-content: center;
  align-items: center;
  width: var(--desk-item-size);
  height: var(--desk-item-size);
  font-size: var(--ui-font-size);
  border: 1px solid transparent;
  margin: 6px;
}

.file-item:hover {
  background-color: #b1f1ff4c;
}
.chosen {
  border: 1px dashed #3bdbff3d;
  // background-color: #ffffff6b;
  background-color: var(--theme-color);
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
    pointer-events: none;
  }

  .file-item_title {
    // color: var(--color-ui-desk-item-title);
    height: calc(0.4 * var(--desk-item-size));
    display: block;
    text-align: center;
    word-break: break-all;
    flex-grow: 0;
    pointer-events: none;
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
    // margin: 0px auto;
    user-select: none;
    // flex-shrink: 0;
  }
  .file-item_title {
    height: calc(1 * var(--menulist-item-height));
    display: flex;
    align-items: center;

    word-break: break-all;
    // flex-grow: 0;
  }
}
</style>
