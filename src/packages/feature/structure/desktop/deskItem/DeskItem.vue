<template>
  <div class="desk-group">
    <div
      draggable="true"
      class="desk-item"
      :class="chosenIndexs.includes(index) ? 'chosen' : 'no-chosen'"
      v-for="(item, index) in appList"
      :key="item.path"
      @dblclick="openapp(item)"
      @contextmenu.stop.prevent="handleRightClick($event, item)"
      @drop="folderDrop($event, item.path)"
      @dragenter.prevent
      @dragover.prevent
      @dragstart="startDrag($event, item)"
      @click="handleClick(index)"
      :ref="
        (ref) => {
          if (ref) {
            appPositions[index] = ref as Element;
          }
        }
      "
    >
      <div class="desk-item_img">
        <FileIcon :file="item" />
      </div>
      <span class="desk-item_title">{{ dealI18nName(basename(item.path)) }}</span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useAppOpen, initAppList } from '@packages/hook/useAppOpen';
import { useSystem } from '@packages/plug';
import { emitEvent, mountEvent } from '@feature/event';
import FileIcon from '@feature/builtin/FileIcon.vue';
import { useContextMenu } from '@packages/hook/useContextMenu';
import { basename } from '@feature/core/Path';
import { VtronFile } from '@feature/core/fileSystem';
import { i18n } from '@feature/i18n';
import { useFileDrag } from '@packages/hook/useFileDrag';
import { onMounted, ref } from 'vue';
import { Rect } from '@/packages/hook/useRectChosen';
import { throttle } from '@/packages/util/debounce';
const { openapp, appList } = useAppOpen('apps');
const { openPropsWindow, copyFile } = useContextMenu();
const sys = useSystem();
const { startDrag, folderDrop } = useFileDrag(sys);

const props = defineProps({
  onChosen: {
    type: Function,
    required: true,
  },
});
const appPositions = ref<Array<Element>>([]);

const chosenIndexs = ref<Array<number>>([]);
function handleClick(index: number) {
  chosenIndexs.value = [index];
}
onMounted(() => {
  mountEvent('file.props.edit', async () => {
    initAppList();
  });
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

function handleRightClick(mouse: MouseEvent, item: VtronFile) {
  if (chosenIndexs.value.length <= 1) {
    chosenIndexs.value = [appList.findIndex((app) => app.path === item.path)];
  }
  emitEvent('contextMenu.show', {
    mouse: mouse,
    menuList: [
      {
        name: i18n('open'),
        click: () => {
          openapp(item);
        },
      },
      {
        name: i18n('props'),
        click: () => {
          chosenIndexs.value.forEach((index) => {
            openPropsWindow(appList[index].path);
          });
        },
      },
      {
        name: i18n('copy'),
        click: () => {
          chosenIndexs.value.forEach((index) => {
            copyFile(appList[index]);
          });
        },
      },
      {
        name: i18n('delete'),
        click: () => {
          chosenIndexs.value.forEach((index) => {
            const item = appList[index];
            if (item.isDirectory) {
              sys?.fs.rmdir(item.path);
            } else {
              sys?.fs.unlink(item.path);
            }
          });
        },
      },
    ],
  });
}
function dealI18nName(name: string) {
  return name;
}
</script>
<style lang="scss" scoped>
.desk-group {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  height: 100%;
  // user-select: none;

  .desk-item {
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
    .desk-item_img {
      width: 60%;
      height: calc(0.6 * var(--desk-item-size));
      margin: 0px auto;
      user-select: none;
      flex-shrink: 0;
    }

    .desk-item_title {
      color: var(--color-ui-desk-item-title);
      height: calc(0.4 * var(--desk-item-size));
      display: block;
      text-align: center;
      word-break: break-all;
      flex-grow: 0;
    }
  }
  .chosen {
    border: 1px dashed #3bdbff3d;
    background-color: #3bdbff28;
  }
  .no-chosen {
    .desk-item_title {
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-all;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
  }

  .desk-item:hover {
    background-color: #3bdbff4c;
  }
}
</style>
