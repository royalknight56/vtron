<template>
  <div class="appicon" @contextmenu.prevent="handleRightClick" @click="handleClick">
    <div class="appicon-img">
      <FileIcon :icon="windowNode.windowInfo.icon" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { UnwrapNestedRefs } from 'vue';
import { emitEvent } from '../../event';
import { BrowserWindow } from '../../window/BrowserWindow';
import FileIcon from '@feature/builtin/FileIcon.vue';
import { i18n } from '@feature/i18n';

let props = defineProps<{
  windowNode: UnwrapNestedRefs<BrowserWindow>;
}>();
function handleRightClick(e: MouseEvent) {
  emitEvent('contextMenu.show', {
    x: 0,
    y: 0,
    mouse: e,
    menuList: [
      {
        name: i18n('close'),
        click: () => {
          props.windowNode.close();
        },
      },
      {
        name: i18n('maximize'),
        click: () => {
          props.windowNode.minimize();
        },
      },
      {
        name: i18n('minimize'),
        click: () => {
          props.windowNode.maximize();
        },
      },
    ],
  });
}
function handleClick() {
  props.windowNode.moveTop();
  if (props.windowNode.windowInfo.state === 'minimize') {
    props.windowNode.restore();
  }
}
</script>
<style lang="scss" scoped>
.appicon {
  width: var(--task-bar-height);
  height: var(--task-bar-height);
  display: flex;
  justify-content: center;
  align-items: center;

  .appicon-img {
    user-select: none;
    width: 60%;
    height: 60%;
  }
}

.appicon:hover {
  background-color: var(--color-gray-hover);
}
</style>
