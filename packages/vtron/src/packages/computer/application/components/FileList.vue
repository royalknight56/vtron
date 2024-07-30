<template>
  <template v-if="mode === 'detail'">
    <div class="file-bar mode-detail">
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
  <FileItem
    v-for="(item, index) in fileListFilter"
    :key="item.path"
    :file="item"
    :theme="theme"
    :mode="mode"
    :chosen-paths="chosenPaths"
    :hover-path="hoverPath"
    :edit-path="editPath"
    @dblclick="handleOnOpen(item)"
    @touchstart.passive="doubleTouch($event, item)"
    @contextmenu.stop.prevent="handleRightClick($event, item, index)"
    @drop="hadnleDrop($event, item.path)"
    @dragenter.prevent="handleDragEnter($event, item, index)"
    @dragover.prevent
    @dragleave="handleDragLeave()"
    @dragstart.stop="startDragApp($event, item)"
    @click="handleClick(item)"
    @mousedown.stop
    @ref="
      (ref) => {
        appPositions[index] = markRaw(ref as Element);
      }
    "
    @edit="onEdit"
  >
  </FileItem>
</template>
<script lang="ts" setup>
import { onMounted, ref, markRaw, inject, computed } from 'vue';
import { VtronFileWithoutContent, basename, dirname, join, System, VtronFile } from '@packages/kernel';
import { i18n } from '@/packages/computer/i18n';
import { openPropsWindow, copyFile, createLink, openWith } from './fileOpt';
import { useFileDrag } from '@/packages/computer/hook/useFileDrag';
import { Rect } from '@/packages/computer/hook/useRectChosen';
import { throttle } from '@/packages/util/debounce';
import FileItem from './FileItem.vue';

const sys = inject<System>('system')!;
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
  // 显示隐藏文件
  showHidden: {
    type: Boolean,
    default: true,
  },
});
const fileListFilter = computed(() => {
  if (props.showHidden) {
    return props.fileList;
  }
  return props.fileList.filter((item) => {
    return !item.name.startsWith('.');
  });
});

const hoverPath = ref<string>('');
const appPositions = ref<Array<Element>>([]);
const chosenPaths = ref<Array<string>>([]);

function handleOnOpen(item: VtronFileWithoutContent) {
  chosenPaths.value = [];
  props.onOpen(item);
  sys.emitEvent('desktop.app.open');
}
function hadnleDrop(mouse: DragEvent, path: string) {
  hoverPath.value = '';
  folderDrop(mouse, path);
  chosenPaths.value = [];
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

const editPath = ref<string>('');
const editName = ref<string>('');
function onEdit(name: string) {
  editName.value = name;
}
function onEditNameEnd() {
  const editEndName = editName.value.trim();
  const editIndex = props.fileList.findIndex((item) => item.path === editPath.value);
  if (editEndName && editIndex >= 0) {
    sys?.fs.rename(editPath.value, join(dirname(editPath.value), editEndName));
    props.onRefresh();
  }
  editPath.value = '';
}
sys.mountEvent('edit.end', () => {
  onEditNameEnd();
});

function handleClick(file: VtronFileWithoutContent) {
  chosenPaths.value = [file.path];
}
onMounted(() => {
  chosenPaths.value = [];
  props.onChosen(
    throttle((rect: Rect) => {
      const tempChosen: string[] = [];
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
          tempChosen.push(props.fileList[index].path);
        }
      });
      chosenPaths.value = tempChosen;
    }, 100)
  );
});

function startDragApp(mouse: DragEvent, item: VtronFileWithoutContent) {
  if (chosenPaths.value.length) {
    startDrag(mouse, chosenPaths.value, () => {
      chosenPaths.value = [];
    });
  } else {
    startDrag(mouse, [item.path], () => {
      chosenPaths.value = [];
    });
  }
}

function handleRightClick(mouse: MouseEvent, item: VtronFileWithoutContent, index: number) {
  if (chosenPaths.value.length <= 1) {
    chosenPaths.value = [item.path];
  }

  sys
    .buildFromTemplate([
      {
        label: i18n('open'),
        click: () => {
          chosenPaths.value = [];
          props.onOpen(item);
        },
      },
      {
        label: i18n('props'),
        click: () => {
          chosenPaths.value.forEach((path) => {
            openPropsWindow(sys, path);
            chosenPaths.value = [];
          });
        },
      },
      {
        label: i18n('open.with'),
        click: () => {
          chosenPaths.value = [];
          openWith(sys, item);
        },
      },
      {
        label: i18n('copy'),
        click: () => {
          copyFile(sys, chosenPaths.value);
          chosenPaths.value = [];
        },
      },
      {
        label: i18n('rename'),
        click: () => {
          editPath.value = item.path;
          editName.value = basename(item.path);
          chosenPaths.value = [];
        },
      },

      {
        label: i18n('create.shortcut'),
        click: () => {
          createLink(sys, item.path)?.then(() => {
            chosenPaths.value = [];
            props.onRefresh();
          });
        },
      },

      {
        label: i18n('delete'),
        click: async () => {
          await Promise.all(
            chosenPaths.value.map((path) => {
              sys?.fs.rm(path);
            })
          );
          chosenPaths.value = [];
          props.onRefresh();
        },
      },
    ])
    .popup(mouse);
}

function handleDragEnter(mouse: DragEvent, item: VtronFileWithoutContent, index: number) {
  hoverPath.value = item.path;
}

function handleDragLeave() {
  hoverPath.value = '';
}
</script>
<style lang="scss" scoped>
.file-bar {
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
  background-color: unset;
  user-select: none;

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
</style>
