<template>
  <div class="menubar" @dblclick="handleEvent('max')" @contextmenu.stop="handleRightClick">
    <div class="menubar-left">
      <div class="menubar-logo">
        <img draggable="false" :src="browserWindow.windowInfo.icon" />
      </div>
      <div class="menubar-title">{{ browserWindow.windowInfo.title }}</div>
    </div>
    <div class="menubar-right">
      <div class="menubar-item" @click="handleEvent('min')">
        <svg class="menubar-icon" viewBox="0 0 1024 1024">
          <path d="M128 512h768a25.6 25.6 0 1 1 0 51.2h-768a25.6 25.6 0 1 1 0-51.2z" />
        </svg>
      </div>
      <div v-if="browserWindow.windowInfo.isMaximize" class="menubar-item" @click="handleEvent('max')">
        <svg class="menubar-icon" viewBox="0 0 1024 1024">
          <path
            d="M959.72 0H294.216a63.96 63.96 0 0 0-63.96 63.96v127.92H64.28A63.96 63.96 0 0 0 0.32 255.84V959.4a63.96 63.96 0 0 0 63.96 63.96h703.56a63.96 63.96 0 0 0 63.96-63.96V792.465h127.92a63.96 63.96 0 0 0 63.96-63.96V63.96A63.96 63.96 0 0 0 959.72 0zM767.84 728.505V959.4H64.28V255.84h703.56z m189.322 0H831.8V255.84a63.96 63.96 0 0 0-63.96-63.96H294.216V63.96H959.72z" />
        </svg>
      </div>
      <div v-else class="menubar-item" @click="handleEvent('max')">
        <svg class="menubar-icon" viewBox="0 0 1024 1024">
          <path
            d="M926.45937303 97.54062697v828.2973677H97.54062697V97.54062697h828.91874606m4.97102697-77.6722963h-838.8608c-39.7682157 0-72.07989097 32.31167525-72.07989097 72.07989096v839.48217837c0 39.7682157 32.31167525 72.07989097 72.07989097 72.07989097h839.48217837c39.7682157 0 72.07989097-32.31167525 72.07989096-72.07989097v-838.8608c0-40.38959408-32.31167525-72.70126933-72.70126933-72.70126933 0.62137837 0 0 0 0 0z" />
        </svg>
      </div>
      <div class="menubar-item" @click="handleEvent('close')">
        <svg class="menubar-icon" viewBox="0 0 1024 1024">
          <path
            d="M566.97558594 521.09667969L856.8828125 231.18945312c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355468l-1.58203125-1.58203125c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0L512 466.51660156 222.09277344 176.21386719c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0l-1.58203125 1.58203125c-15.02929688 14.63378906-15.02929688 38.75976563 0 53.39355469l289.90722656 289.90722656L167.1171875 811.00390625c-14.63378906 14.63378906-14.63378906 38.75976563 0 53.39355469l1.58203125 1.58203125c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0L512 576.07226563 801.90722656 865.97949219c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0l1.58203125-1.58203125c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355469L566.97558594 521.09667969z"
            fill="#363F4D" />
        </svg>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { BrowserWindow } from '../BrowserWindow';
import { UnwrapNestedRefs } from 'vue';
import { emitEvent } from '../../event';
let props = defineProps<{
  browserWindow: UnwrapNestedRefs<BrowserWindow>;
}>();
function handleEvent(event: string) {
  switch (event) {
    case 'min':
      props.browserWindow.minimize();
      break;
    case 'max':
      if (props.browserWindow.windowInfo.isMaximize) {
        props.browserWindow.unmaximize();
      } else {
        props.browserWindow.maximize();
      }
      break;
    case 'close':
      props.browserWindow.close();
      break;
  }
}
function handleRightClick(e: MouseEvent) {
  e.preventDefault();
  emitEvent('window.menubar.rightclick', {
    mouse: e,
    window: props.browserWindow
  })
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
  color: rgb(51, 51, 51);
  overflow: hidden;
  display: flex;
  justify-content: space-between;

  .menubar-left {
    display: flex;
    text-align: center;
    /* justify-content: center; */
    align-items: center;

    .menubar-title {
      padding: 0 10px;
      color: black;
      font-family: "Segoe UI", Tahoma, sans-serif;
      font-weight: 400;
      font-size: 12px;
      display: inline;
      padding: 0 10px;
    }

    .menubar-logo {
      height: 24px;
      width: 30px;

      img {
        width: 18px;
      }
    }
  }

  .menubar-right {
    display: flex;
    text-align: center;
    /* justify-content: center; */
    align-items: center;

    .menubar-item {
      padding: 0 10px;
      color: black;
      font-family: "Segoe UI", Tahoma, sans-serif;
      font-weight: 400;
      font-size: 12px;
      display: inline;
      padding: 0 10px;
      cursor: pointer;

      .menubar-icon {
        width: var(--menu-bar-button-size);
        height: var(--menu-bar-button-size);
      }
    }
  }
}
</style>