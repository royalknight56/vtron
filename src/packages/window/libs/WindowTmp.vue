<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-15 11:10:16
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/WindowTmp.vue
 Need CodeReview 
-->
<template>
  <div class="wintmp_outer dragwin" :style="customerStyle" @touchstart.passive="onFocus" @mousedown="onFocus" :class="{
    topwin: istop,
    noframes: !wininfo.frame, transparent: wininfo.transparent
  }, DragWindowItem?.windowInfo.status" ref="$win_outer">
    <div class="wintmp_uper" @dblclick="maxWindow()" @contextmenu.prevent="uperRightClick">
      <div class="wintmp_left">
        <div class="wintmp_logo">
          <img draggable="false" :src="wininfo.icon" />
        </div>
        <div class="wintmp_title">{{ wininfo.title }}</div>
      </div>
      <Statebar @buttonEvent="handelButtonEvent" :isMaximize="isMaximize" :isScaleAble="isScaleAble" :wininfo="wininfo">
      </Statebar>
    </div>
    <div class="wintmp_main" :class="{ resizeing: resizemode != 'null' }" @mousedown.stop="predown"
      @touchstart.stop.passive="predown">
      <WindowInner :id="winID" :componentKey="componentKey"></WindowInner>
    </div>
    <div class="right_border win_drag_border" :class="{ isChoseMode: resizemode == 'r' }" v-if="isScaleAble"
      @mousedown.stop.prevent="startScale($event, 'r')" @touchstart.stop.passive="startScale($event, 'r')"></div>
    <div class="bottom_border win_drag_border" :class="{ isChoseMode: resizemode == 'b' }" v-if="isScaleAble"
      @mousedown.stop.prevent="startScale($event, 'b')" @touchstart.stop.passive="startScale($event, 'b')"></div>
    <div class="left_border win_drag_border" :class="{ isChoseMode: resizemode == 'l' }" v-if="isScaleAble"
      @mousedown.stop.prevent="startScale($event, 'l')" @touchstart.stop.passive="startScale($event, 'l')"></div>
    <div class="top_border win_drag_border" :class="{ isChoseMode: resizemode == 't' }" v-if="isScaleAble"
      @mousedown.stop.prevent="startScale($event, 't')" @touchstart.stop.passive="startScale($event, 't')"></div>
    <div class="right_bottom_border win_drag_border" :class="{ isChoseMode: resizemode == 'rb' }" v-if="isScaleAble"
      draggable="false" @mousedown.stop.prevent="startScale($event, 'rb')"
      @touchstart.stop.passive="startScale($event, 'rb')"></div>
    <div class="left_bottom_border win_drag_border" :class="{ isChoseMode: resizemode == 'lb' }" v-if="isScaleAble"
      draggable="false" @mousedown.stop.prevent="startScale($event, 'lb')"
      @touchstart.stop.passive="startScale($event, 'lb')"></div>
    <div class="left_top_border win_drag_border" :class="{ isChoseMode: resizemode == 'lt' }" v-if="isScaleAble"
      draggable="false" @mousedown.stop.prevent="startScale($event, 'lt')"
      @touchstart.stop.passive="startScale($event, 'lt')"></div>
    <div class="right_top_border win_drag_border" :class="{ isChoseMode: resizemode == 'rt' }" v-if="isScaleAble"
      draggable="false" @mousedown.stop.prevent="startScale($event, 'rt')"
      @touchstart.stop.passive="startScale($event, 'rt')"></div>


  </div>
</template>
<script lang="ts" setup>
import { inject, provide, ref, watch } from "vue";
import { onMounted, computed } from "vue";
import type { PropType } from "vue";
import { WindowInfo, defaultWinInfo } from "@/packages/window/libs/DragWindow/option";
import { DragElement } from "@libs/Dom/DragElement";
import { ScaleElement } from "@libs/Dom/ScaleElement";
import Statebar from "@libs/WindowTemplate/statebarButton.vue";
import WindowInner from "@libs/WindowTemplate/windowInner.vue";
import { System } from '@libs/System'
let props = defineProps({
  id: {
    type: String,
    required: true,
  }
});

let system = <System>inject('system')
let winID = props.id;
// 传递windowid
provide("windowId", winID);

let DragWindowItem = system.getWindow(winID);

let wininfo = DragWindowItem?.windowInfo || { ...defaultWinInfo };
let winStatus = DragWindowItem?.windowInfo.status;
const componentKey = ref<Number>(1);
function flushWindow(): void {
  componentKey.value = Math.round(Math.random() * 10000);
}
function closeWindow(): void {
  DragWindowItem?.destroy()
}
function hideWindow() {
  DragWindowItem?.hide()
}
function maxWindow() {
  if (isScaleAble.value) {
    if (DragWindowItem?.isMaximized()) {
      DragWindowItem?.unmaximize()
    } else {
      DragWindowItem?.maximize()
    }
  }
}
function predown() {
  DragWindowItem?.moveTop()
}
type buttonEvent = 'flush' | 'close' | 'min' | 'max'
const buttonEventFunc = {
  close: closeWindow,
  min: hideWindow,
  max: maxWindow,
  flush: flushWindow,
};
function handelButtonEvent(event: buttonEvent) {
  buttonEventFunc[event]();
}
function uperRightClick(e: MouseEvent) {
  system.ContextMenu.callMenu(e, [
    {
      name: "关闭",
      click: () => {
        DragWindowItem?.destroy()
      },
    },
    {
      name: "最小化",
      click: () => {
        DragWindowItem?.hide()
      },
    },
  ]);
}

let customerStyle = ref<any>({});

function onFocus(e: MouseEvent | TouchEvent): void {
  DragWindowItem?.moveTop()
  if (isMaximize.value) {
    if (e instanceof MouseEvent) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}

let istop = computed(() => wininfo.istop);
let isMaximize = computed(() => wininfo.isMaximize);

// let winWidth = ref(wininfo.width);
// let winHeight = ref(wininfo.height);
let winX = ref(wininfo.x);
let winY = ref(wininfo.y);

/*
 *计算样式
 */
onMounted(() => {
  customerStyle.value = {
    width: computed(() => wininfo.width + "px"),
    height: computed(() => wininfo.height + "px"),
    left: computed(() => wininfo.x + "px"),
    top: computed(() => wininfo.y + "px"),

    zIndex: computed(() => {
      return wininfo.zindex;
    }),
    display: computed(() => {
      if (wininfo.isVisible) {
        return "";
      } else {
        return "none";
      }
    }),
  };
  watch(
    () => wininfo.x,
    (newVal, oldVal) => {
      winX.value = newVal;
    }
  );
  watch(
    () => wininfo.y,
    (newVal, oldVal) => {
      winY.value = newVal;
    }
  );
});

/*
挂载拖动事件
*/
let $win_outer = ref(null);
onMounted(() => {
  let dragAble = new DragElement(wininfo.x, wininfo.y);
  dragAble.mountDomEvent($win_outer.value);
  watch(
    () => wininfo.isMaximize,
    (n, o) => {
      if (n) {
        dragAble.canDrag = false;
      } else {
        dragAble.canDrag = true;
      }
    }
  );
  dragAble.onDrag((x, y) => {
    if (!wininfo.isMaximize) {
      wininfo.x = x;
      wininfo.y = y;
    }
  });
});

/*
挂载缩放事件
*/
let isScaleAble = ref(wininfo.isScalable);
let resizemode = ref("null");
let scaleAble: ScaleElement;
onMounted(() => {
  scaleAble = new ScaleElement(resizemode, wininfo.width, wininfo.height, wininfo.x, wininfo.y);
  scaleAble.onResize((width: number, height: number, x: number, y: number) => {
    wininfo.width = width || wininfo.width;
    wininfo.height = height || wininfo.height;
    wininfo.x = x || wininfo.x;
    wininfo.y = y || wininfo.y;
  });
})
function startScale(e: MouseEvent | TouchEvent, dire: string) {
  scaleAble?.startScale(e, dire, wininfo.x, wininfo.y, wininfo.width, wininfo.height);
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
@import "@/packages/main.css";

.wintmp_outer {
  position: absolute;
  padding: 0;
  margin: 0;
  left: 0;
  top: 0;
  width: 100px;
  height: 100px;
  background-color: rgb(255, 255, 255);
  border: 1px solid #0078d7;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 0 1px rgb(246 246 247 / 92%),
    0 7px 19px rgb(0 0 0 / 58%);

  .wintmp_uper {
    cursor: default;
    user-select: none;
    flex-shrink: 0;
    position: relative;
    top: 0;
    width: 100%;
    height: 30px;
    line-height: 30px;
    font-weight: 100;
    color: rgb(51, 51, 51);
    overflow: hidden;

    .wintmp_left {
      display: flex;
      text-align: center;
      /* justify-content: center; */
      align-items: center;

      .wintmp_title {
        padding: 0 10px;
        color: black;
        font-family: "Segoe UI", Tahoma, sans-serif;
        font-weight: 400;
        font-size: 12px;
        display: inline;
        padding: 0 10px;
      }

      .wintmp_logo {
        height: 24px;
        width: 30px;

        img {
          width: 18px;
        }
      }
    }
  }

  .wintmp_main {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: rgb(255, 255, 255);
    overflow: hidden;
    contain: content;
  }

}

.topwin {
  border: 1px solid #0078d7;
  box-shadow: inset 0 0 0 1px rgb(246 246 247 / 92%),
    0 7px 19px rgb(0 0 0 / 90%);
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
  height: calc(100% - 38px) !important;
  transition: width 0.1s ease-in-out, height 0.1s ease-in-out;
}

.fullscreen {
  position: absolute;
  left: 0 !important;
  top: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 105 !important;
  border: none;

  .wintmp_uper {
    display: none;
  }
}

.noframes {
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