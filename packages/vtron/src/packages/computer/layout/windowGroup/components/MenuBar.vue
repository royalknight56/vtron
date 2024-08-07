<template>
  <div class="menubar" @dblclick="handleEvent('max')" @contextmenu.stop="handleRightClick">
    <div class="menubar-left">
      <div v-if="browserWindow.windowInfo.icon" class="menubar-logo">
        <FileIcon :icon="browserWindow.windowInfo.icon" />
      </div>
      <div class="menubar-title">{{ browserWindow.windowInfo.title }}</div>
    </div>
    <WinUpButtonGroup :browser-window="browserWindow"></WinUpButtonGroup>
  </div>
</template>
<script lang="ts" setup>
import { BrowserWindow } from '@/packages/services';
import { inject, UnwrapNestedRefs } from 'vue';
import { System } from '@packages/kernel';
import FileIcon from '@/packages/computer/application/FileIcon.vue';
import WinUpButtonGroup from '@/packages/components/WinUpButtonGroup.vue';
import { WindowStateEnum } from '@/packages/services/window/BrowserWindow';
import { i18n } from '@/packages/computer/i18n';
const sys = inject<System>('system')!;
const props = defineProps<{
  browserWindow: UnwrapNestedRefs<BrowserWindow>;
}>();
function handleEvent(event: string) {
  switch (event) {
    case 'min':
      props.browserWindow.minimize();
      break;
    case 'max':
      if (props.browserWindow.isResizable()) {
        if (props.browserWindow.windowInfo.state === WindowStateEnum.maximize) {
          props.browserWindow.unmaximize();
        } else {
          props.browserWindow.maximize();
        }
      }
      break;
    case 'close':
      props.browserWindow.destroy();
      break;
  }
}

/**
 * 顶栏右键点击
 * @param mouse
 */
function handleRightClick(mouse: MouseEvent) {
  mouse.preventDefault();
  sys.emitEvent('window.menubar.rightclick', {
    mouse: mouse,
    window: props.browserWindow,
  });
  sys
    .buildFromTemplate([
      {
        label: i18n('maximize'),
        click: () => {
          props.browserWindow.maximize();
        },
      },
      {
        label: i18n('minimize'),
        click: () => {
          props.browserWindow.minimize();
        },
      },
      {
        label: i18n('close'),
        click: () => {
          props.browserWindow.close();
        },
      },
    ])
    .popup(mouse);
}
</script>
<style lang="scss" scoped>
.menubar {
  cursor: default;
  user-select: none;
  flex-shrink: 0;
  position: relative;
  top: 0;
  width: 100%;
  height: var(--menu-bar-height);
  line-height: var(--menu-bar-height);
  font-weight: 100;

  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .menubar-left {
    display: flex;
    text-align: center;
    overflow: hidden;
    /* justify-content: center; */
    align-items: center;

    .menubar-title {
      padding: 0 10px;
      font-family: 'Segoe UI', Tahoma, sans-serif;
      font-weight: 400;
      font-size: 12px;
      display: inline;
      padding: 0 10px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .menubar-logo {
      height: 24px;
      width: 30px;
      align-items: center;
      display: flex;
      justify-content: center;
      flex-shrink: 0;
      img {
        width: 18px;
      }
    }
  }
}
</style>
