<template>
  <div class="desk-group">
    <div
      draggable="true"
      class="desk-item"
      v-for="item in appList"
      :key="item.path"
      @dblclick="openapp(item)"
      @contextmenu.stop.prevent="handleRightClick($event, item)"
      @drop="folderDrop($event, item.path)"
      @dragenter.prevent
      @dragover.prevent
      @dragstart="startDrag($event, item)"
    >
      <div class="desk-item_img">
        <FileIcon :file="item" />
      </div>
      <span class="desk-item_title">{{ basename(item.path) }}</span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useAppOpen } from '@packages/hook/useAppOpen';
import { useSystem } from '@packages/plug';
import { emitEvent } from '@feature/event';
import FileIcon from '@feature/builtin/FileIcon.vue';
import { openPropsWindow } from '@packages/hook/useContextMenu';
import { basename } from '@feature/core/Path';
import { VtronFile } from '@feature/core/fileSystem';
import { i18n } from '@feature/i18n';
import { useFileDrag } from '@packages/hook/useFileDrag';
const { openapp, appList } = useAppOpen('apps');

const sys = useSystem();
const { startDrag, folderDrop } = useFileDrag(sys);
function handleRightClick(mouse: MouseEvent, item: VtronFile) {
  emitEvent('contextMenu.show', {
    mouse: mouse,
    menuList: [
      {
        name: i18n('open'),
        click: () => openapp(item),
      },
      {
        name: i18n('props'),
        click: () => {
          openPropsWindow(item.path);
        },
      },
      {
        name: i18n('delete'),
        click: () => {
          if (item.isDirectory) {
            sys?.fs.rmdir(item.path);
          } else {
            sys?.fs.unlink(item.path);
          }
        },
      },
    ],
  });
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
    margin: 6px;

    .desk-item_img {
      width: 60%;
      height: 60%;
      margin: 4px auto;
      user-select: none;
    }

    .desk-item_title {
      color: var(--color-ui-desk-item-title);
      display: block;
      text-align: center;
    }
  }

  .desk-item:hover {
    background-color: #3bdbff4c;
  }
}
</style>
