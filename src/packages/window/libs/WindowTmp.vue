<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-15 11:10:16
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/WindowTmp.vue
 Need CodeReview 
-->
<template>
  <div class="wintmp_outer dragwin" :style="customerStyle" @touchstart.passive="onFocus" @mousedown="onFocus"
    :class="{ topwin: istop, maxwin: isMaximize, noframes:!wininfo.frame }" ref="$win_outer">
    <div class="wintmp_uper" @dblclick="maxWindow()" @contextmenu.prevent="uperRightClick">
      <div class="wintmp_left">
        <div class="wintmp_logo">
          <img draggable="false" :src="ctx.icon" />
        </div>
        <div class="wintmp_title">{{ ctx.title }}</div>
      </div>
      <Statebar @buttonEvent="handelButtonEvent" :isMaximize="isMaximize" :isScaleAble="isScaleAble" :wininfo="wininfo">
      </Statebar>
    </div>
    <div class="wintmp_main" :class="{ resizeing: resizemode != 'null' }" @mousedown.stop="predown"
      @touchstart.stop.passive="predown">
      <WindowInner :id="winID" :componentKey="componentKey"></WindowInner>
    </div>
    <div class="right_border" v-if="isScaleAble" @mousedown.stop.prevent="startScale($event, 'r')"
      @touchstart.stop.passive="startScale($event, 'r')"></div>
    <div class="bottom_border" v-if="isScaleAble" @mousedown.stop.prevent="startScale($event, 'b')"
      @touchstart.stop.passive="startScale($event, 'b')"></div>
    <div class="right_bottom_border" v-if="isScaleAble" draggable="false"
      @mousedown.stop.prevent="startScale($event, 'rb')" @touchstart.stop.passive="startScale($event, 'rb')"></div>
  </div>
</template>
<script lang="ts" setup>
import { inject, provide, ref, watch } from "vue";
import { onMounted, computed } from "vue";
import type { PropType } from "vue";
import { WindowInfo } from "@libs/DragWindow/type";
import { DragElement } from "@libs/Dom/DragElement";
import { ScaleElement } from "@libs/Dom/ScaleElement";
import Statebar from "@libs/WindowTemplate/statebarButton.vue";
import WindowInner from "@libs/WindowTemplate/windowInner.vue";
import { System } from '@libs/System'
let props = defineProps({
  id: {
    type: String,
    required: true,
  },
  ctx: {
    type: Object as PropType<WindowInfo>,
    default: {
      app: {
        unmount: () => { },
      }, //创建的app
      content: {}, //组件vue
    },
  },
});

let system = <System>inject('system')
let winID = props.id;

let DragWindowItem = system.getWindow(winID);
let wininfo = DragWindowItem.windowInfo;
const componentKey = ref<Number>(1);
function flushWindow(): void {
  componentKey.value = Math.round(Math.random() * 10000);
}
function closeWindow(): void {
  DragWindowItem.destroy()
}
function hideWindow() {
  DragWindowItem.hide()
}
function maxWindow() {
  if (isScaleAble.value) {
    if (DragWindowItem.isMaximized()) {
      DragWindowItem.unmaximize()
    } else {
      DragWindowItem.maximize()
    }
  }
}
function predown() {
  DragWindowItem.moveTop()
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
        DragWindowItem.destroy()
      },
    },
    {
      name: "最小化",
      click: () => {
        DragWindowItem.hide()
      },
    },
  ]);
}

let customerStyle = ref<any>({});

function onFocus(e: MouseEvent | TouchEvent): void {
  DragWindowItem.moveTop()
  if (isMaximize.value) {
    if (e instanceof MouseEvent) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}

let istop = computed(() => wininfo.istop);
let isMaximize = computed(() => wininfo.isMaximize);

let winWidth = ref(wininfo.width);
let winHeight = ref(wininfo.height);

/*
 *计算样式
 */
onMounted(() => {
  customerStyle.value = {
    width: computed(() => winWidth.value + "px"),
    height: computed(() => winHeight.value + "px"),
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
});
// 传递windowid
provide("windowId", winID);

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
let scaleAble = new ScaleElement(resizemode, winWidth, winHeight);

scaleAble.onResize((width: number, height: number) => {
  wininfo.width = width || wininfo.width;
  wininfo.height = height || wininfo.height;
});
function startScale(e: MouseEvent | TouchEvent, dire: string) {
  scaleAble?.startScale(e, dire);
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
  display: block;
  width: 100px;
  height: 100px;
  background-color: rgb(255, 255, 255);

  /* border: 1px solid rgb(194, 194, 194); */
  border: 2px solid rgb(194, 194, 194);

  display: flex;
  flex-direction: column;
  /**/
  border: #0078d7;
  border-width: 1px;
  border-style: solid;
  box-shadow: inset 0 0 0 1px rgb(246 246 247 / 92%),
    0 7px 19px rgb(0 0 0 / 58%);
  padding: 0px;
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

.maxwin {
  position: absolute;
  left: 0 !important;
  top: 0 !important;
  width: 100% !important;
  height: calc(100% - 38px) !important;
  transition: width 0.1s ease-in-out, height 0.1s ease-in-out;
}
.noframes{
  .wintmp_uper{
    display: none;
  }
  border: none;
  box-shadow: none;
  .right_border{
    display: none;
  }
  .bottom_border{
    display: none;
  }
  .right_bottom_border{
    display: none;
  }
}
.wintmp_uper {
  flex-shrink: 0;
  position: relative;
  cursor: default;
  user-select: none;
  top: 0;
  width: 100%;
  height: 30px;
  line-height: 30px;
  font-weight: 100;
  /* background-color: rgba(255, 255, 255, 0.774); */
  color: rgb(51, 51, 51);
  overflow: hidden;
}

.wintmp_left {
  display: flex;
  text-align: center;
  /* justify-content: center; */
  align-items: center;
}

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
}

.wintmp_logo img {
  width: 18px;
}

.wintmp_main {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: rgb(255, 255, 255);
  overflow: hidden;
  contain: content;
}

.right_border {
  cursor: ew-resize;
  position: absolute;
  right: -12px;
  background-color: rgba(0, 0, 0, 0);
  width: 16px;
  height: calc(100% - 4px);
}

.bottom_border {
  cursor: ns-resize;
  position: absolute;
  bottom: -12px;
  background-color: rgba(0, 0, 0, 0);
  width: calc(100% - 4px);
  height: 16px;
}

.right_bottom_border {
  cursor: nwse-resize;
  position: absolute;
  right: -12px;
  bottom: -12px;
  background-color: rgba(0, 0, 0, 0);
  width: 16px;
  height: 16px;
}

.resizeing {
  user-select: none;
  pointer-events: none;
}
</style>