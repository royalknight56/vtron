<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-15 11:10:16
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/WindowTmp.vue
 Need CodeReview 
-->
<template>
  <div
    class="wintmp_outer dragwin"
    :class="{
      topwin: istop,
      max: windowInfo.state == WindowStateEnum.maximize,
      min: windowInfo.state == WindowStateEnum.minimize,
      fullscreen: windowInfo.state == WindowStateEnum.fullscreen,
      noframe: !windowInfo.frame,
      disable: windowInfo.disable,
    }"
    :style="customerStyle"
    @touchstart.passive="onFocus"
    @mousedown="onFocus"
    ref="$win_outer"
  >
    <div class="wintmp_uper" @contextmenu.prevent>
      <MenuBar :browser-window="browserWindow"></MenuBar>
    </div>
    <div
      class="wintmp_main"
      :class="{ resizeing: resizemode != 'null' }"
      @mousedown.stop="predown"
      @touchstart.stop.passive="predown"
      @contextmenu.stop.prevent
    >
      <WindowInner :window="browserWindow"></WindowInner>
    </div>
    <div
      class="right_border win_drag_border"
      :class="{ isChoseMode: resizemode == 'r' }"
      v-if="resizable"
      @mousedown.stop.prevent="startScale($event, 'r')"
      @touchstart.stop.passive="startScale($event, 'r')"
    ></div>
    <div
      class="bottom_border win_drag_border"
      :class="{ isChoseMode: resizemode == 'b' }"
      v-if="resizable"
      @mousedown.stop.prevent="startScale($event, 'b')"
      @touchstart.stop.passive="startScale($event, 'b')"
    ></div>
    <div
      class="left_border win_drag_border"
      :class="{ isChoseMode: resizemode == 'l' }"
      v-if="resizable"
      @mousedown.stop.prevent="startScale($event, 'l')"
      @touchstart.stop.passive="startScale($event, 'l')"
    ></div>
    <div
      class="top_border win_drag_border"
      :class="{ isChoseMode: resizemode == 't' }"
      v-if="resizable"
      @mousedown.stop.prevent="startScale($event, 't')"
      @touchstart.stop.passive="startScale($event, 't')"
    ></div>
    <div
      class="right_bottom_border win_drag_border"
      :class="{ isChoseMode: resizemode == 'rb' }"
      v-if="resizable"
      draggable="false"
      @mousedown.stop.prevent="startScale($event, 'rb')"
      @touchstart.stop.passive="startScale($event, 'rb')"
    ></div>
    <div
      class="left_bottom_border win_drag_border"
      :class="{ isChoseMode: resizemode == 'lb' }"
      v-if="resizable"
      draggable="false"
      @mousedown.stop.prevent="startScale($event, 'lb')"
      @touchstart.stop.passive="startScale($event, 'lb')"
    ></div>
    <div
      class="left_top_border win_drag_border"
      :class="{ isChoseMode: resizemode == 'lt' }"
      v-if="resizable"
      draggable="false"
      @mousedown.stop.prevent="startScale($event, 'lt')"
      @touchstart.stop.passive="startScale($event, 'lt')"
    ></div>
    <div
      class="right_top_border win_drag_border"
      :class="{ isChoseMode: resizemode == 'rt' }"
      v-if="resizable"
      draggable="false"
      @mousedown.stop.prevent="startScale($event, 'rt')"
      @touchstart.stop.passive="startScale($event, 'rt')"
    ></div>
  </div>
</template>
<script lang="ts" setup>
import { provide, ref, watch } from 'vue';
import { onMounted, computed, UnwrapNestedRefs } from 'vue';
import { WindowStateEnum } from './BrowserWindow';
import WindowInner from './components/WindowInner.vue';
// import type { PropType } from "vue";
//   import { WindowInfo, defaultWinInfo } from "@packages/window/libs/DragWindow/option";
import { DragElement } from '@feature/window/dom/DragElement';
import { ScaleElement } from '@feature/window/dom/ScaleElement';
// import WindowInner from "@packages/window/structure/windowContent/windowInner.vue";
import { BrowserWindow } from '@feature/window/BrowserWindow';
import MenuBar from './components/MenuBar.vue';
import { emitEvent } from '../event';

const props = defineProps<{
  browserWindow: UnwrapNestedRefs<BrowserWindow>;
}>();

const browserWindow = props.browserWindow;
const windowInfo = browserWindow.windowInfo;
// 传递windowid
provide('browserWindow', browserWindow);

function predown() {
  browserWindow.moveTop();
  emitEvent('window.content.click', browserWindow);
}

const customerStyle = ref<NonNullable<unknown>>({});

function onFocus(e: MouseEvent | TouchEvent): void {
  browserWindow?.moveTop();
  if (windowInfo.state === WindowStateEnum.maximize) {
    if (e instanceof MouseEvent) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}

const istop = computed(() => windowInfo.istop);

/*
 *计算样式
 */
onMounted(() => {
  customerStyle.value = {
    width: computed(() => windowInfo.width + 'px'),
    height: computed(() => windowInfo.height + 'px'),
    left: computed(() => windowInfo.x + 'px'),
    top: computed(() => windowInfo.y + 'px'),

    zIndex: computed(() => {
      if (windowInfo.alwaysOnTop) {
        return 9999;
      }
      return windowInfo.zindex;
    }),
    backgroundColor: computed(() => windowInfo.backgroundColor),
  };
});

/*
挂载拖动事件
*/
const $win_outer = ref(null);
onMounted(() => {
  const dragAble = new DragElement($win_outer.value, windowInfo.x, windowInfo.y);
  watch(
    () => windowInfo.state === WindowStateEnum.maximize,
    (n) => {
      if (n) {
        dragAble.canDrag = false;
      } else {
        dragAble.canDrag = true;
      }
    }
  );
  dragAble.onDrag((x, y) => {
    if (windowInfo.disable) {
      return;
    }
    if (windowInfo.state !== WindowStateEnum.maximize) {
      windowInfo.x = x;
      windowInfo.y = y;
    }
  });
});

/*
挂载缩放事件
*/
const resizable = ref(windowInfo.resizable);
const resizemode = ref('null');
let scaleAble: ScaleElement;
onMounted(() => {
  scaleAble = new ScaleElement(resizemode, windowInfo.width, windowInfo.height, windowInfo.x, windowInfo.y);
  scaleAble.onResize((width: number, height: number, x: number, y: number) => {
    windowInfo.width = width || windowInfo.width;
    windowInfo.height = height || windowInfo.height;
    windowInfo.x = x || windowInfo.x;
    windowInfo.y = y || windowInfo.y;
  });
});
function startScale(e: MouseEvent | TouchEvent, dire: string) {
  if (windowInfo.disable) {
    return;
  }
  scaleAble?.startScale(e, dire, windowInfo.x, windowInfo.y, windowInfo.width, windowInfo.height);
}
</script>
<style>
.dragwin {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
<style scoped lang="scss">
.wintmp_outer {
  position: absolute;
  padding: 0;
  margin: 0;
  left: 0;
  top: 0;
  width: 100px;
  height: 100px;
  background-color: #fff;
  border: var(--window-border);
  display: flex;
  flex-direction: column;
  box-shadow: var(--window-box-shadow);
  border-radius: var(--window-border-radius);

  overflow: hidden;

  .wintmp_main {
    position: relative;
    width: 100%;
    height: 100%;
    // background-color: rgb(255, 255, 255);
    overflow: hidden;
    contain: content;
  }
}

.topwin {
  border: 1px solid #0078d7;
  box-shadow: var(--window-top-box-shadow);
}

.icon {
  width: 12px;
  height: 12px;
}

.max {
  position: absolute;
  left: 0 !important;
  top: 0 !important;
  width: 100% !important;
  height: 100% !important;
  transition:
    width 0.1s ease-in-out,
    height 0.1s ease-in-out;
}

.disable {
  .wintmp_uper {
    pointer-events: none;
  }

  .wintmp_main {
    pointer-events: none;
  }
}

.min {
  display: none;
}

.fullscreen {
  position: fixed;
  left: 0 !important;
  top: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 205 !important;
  border: none;

  .wintmp_uper {
    display: none;
  }
}

.noframe {
  .wintmp_uper {
    display: none;
  }

  border: none;
  box-shadow: none;

  .win_drag_border {
    display: none;
  }
}

.transparent {
  background-color: transparent;

  .wintmp_main {
    background-color: transparent;
  }

  .wintmp_uper {
    background-color: rgba(255, 255, 255, 0.774);
  }
}

.win_drag_border {
  position: absolute;
  background-color: rgba(0, 0, 0, 0);
}

.right_border {
  cursor: ew-resize;
  right: -12px;
  width: 16px;
  height: calc(100% - 4px);
}

.bottom_border {
  cursor: ns-resize;
  bottom: -12px;
  width: calc(100% - 4px);
  height: 16px;
}

.left_border {
  cursor: ew-resize;
  left: -12px;
  width: 16px;
  height: calc(100% - 4px);
}

.top_border {
  cursor: ns-resize;
  top: -12px;
  width: calc(100% - 4px);
  height: 16px;
}

.left_top_border {
  cursor: nwse-resize;
  left: -12px;
  top: -12px;
  width: 16px;
  height: 16px;
}

.right_top_border {
  cursor: nesw-resize;
  right: -12px;
  top: -12px;
  width: 16px;
  height: 16px;
}

.left_bottom_border {
  cursor: nesw-resize;
  left: -12px;
  bottom: -12px;
  width: 16px;
  height: 16px;
}

.right_bottom_border {
  cursor: nwse-resize;
  right: -12px;
  bottom: -12px;
  width: 16px;
  height: 16px;
}

.isChoseMode {
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
}

.resizeing {
  user-select: none;
  pointer-events: none;
}
</style>
