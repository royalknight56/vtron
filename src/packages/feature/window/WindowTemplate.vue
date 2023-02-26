<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-15 11:10:16
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/WindowTmp.vue
 Need CodeReview 
-->
<template>
  <!-- :class="{
    topwin: istop,
    noframes: !browserWindow.frame, transparent: browserWindow.transparent
  }" -->
  <div class="wintmp_outer dragwin" :class="{
    topwin: istop,
    max: windowInfo.isMaximize,
  }" :style="customerStyle" @touchstart.passive="onFocus" @mousedown="onFocus" ref="$win_outer">
    <div class="wintmp_uper" @contextmenu.prevent="uperRightClick">
      <MenuBar :browser-window="browserWindow"></MenuBar>
    </div>
    <div class="wintmp_main" :class="{ resizeing: resizemode != 'null' }" @mousedown.stop="predown"
      @touchstart.stop.passive="predown">
      <component :is="browserWindow.content" :key="componentKey"></component>
      <!-- <WindowInner :id="winID" :componentKey="componentKey"></WindowInner> -->
    </div>
    <div class="right_border win_drag_border" :class="{ isChoseMode: resizemode == 'r' }" v-if="resizable"
      @mousedown.stop.prevent="startScale($event, 'r')" @touchstart.stop.passive="startScale($event, 'r')"></div>
    <div class="bottom_border win_drag_border" :class="{ isChoseMode: resizemode == 'b' }" v-if="resizable"
      @mousedown.stop.prevent="startScale($event, 'b')" @touchstart.stop.passive="startScale($event, 'b')"></div>
    <div class="left_border win_drag_border" :class="{ isChoseMode: resizemode == 'l' }" v-if="resizable"
      @mousedown.stop.prevent="startScale($event, 'l')" @touchstart.stop.passive="startScale($event, 'l')"></div>
    <div class="top_border win_drag_border" :class="{ isChoseMode: resizemode == 't' }" v-if="resizable"
      @mousedown.stop.prevent="startScale($event, 't')" @touchstart.stop.passive="startScale($event, 't')"></div>
    <div class="right_bottom_border win_drag_border" :class="{ isChoseMode: resizemode == 'rb' }" v-if="resizable"
      draggable="false" @mousedown.stop.prevent="startScale($event, 'rb')"
      @touchstart.stop.passive="startScale($event, 'rb')"></div>
    <div class="left_bottom_border win_drag_border" :class="{ isChoseMode: resizemode == 'lb' }" v-if="resizable"
      draggable="false" @mousedown.stop.prevent="startScale($event, 'lb')"
      @touchstart.stop.passive="startScale($event, 'lb')"></div>
    <div class="left_top_border win_drag_border" :class="{ isChoseMode: resizemode == 'lt' }" v-if="resizable"
      draggable="false" @mousedown.stop.prevent="startScale($event, 'lt')"
      @touchstart.stop.passive="startScale($event, 'lt')"></div>
    <div class="right_top_border win_drag_border" :class="{ isChoseMode: resizemode == 'rt' }" v-if="resizable"
      draggable="false" @mousedown.stop.prevent="startScale($event, 'rt')"
      @touchstart.stop.passive="startScale($event, 'rt')"></div>


  </div>
</template>
<script lang="ts" setup>
import { inject, provide, ref, watch } from "vue";
import { onMounted, computed, UnwrapNestedRefs } from "vue";
// import type { PropType } from "vue";
//   import { WindowInfo, defaultWinInfo } from "@/packages/window/libs/DragWindow/option";
import { DragElement } from "@packages/feature/window/dom/DragElement";
import { ScaleElement } from "@packages/feature/window/dom/ScaleElement";
// import Statebar from "@/packages/window/structure/windowContent/statebarButton.vue";
// import WindowInner from "@/packages/window/structure/windowContent/windowInner.vue";
import { BrowserWindow } from '@packages/feature/window/BrowserWindow';
import MenuBar from "./components/MenuBar.vue";

let props = defineProps<{
  browserWindow: UnwrapNestedRefs<BrowserWindow>
}>()

let browserWindow = props.browserWindow;
let windowInfo = browserWindow.windowInfo;
// 传递windowid
provide("browserWindow", browserWindow);

let winStatus = browserWindow.id;
const componentKey = ref<Number>(1);


function predown() {
  browserWindow.moveTop();
}


function uperRightClick(e: MouseEvent) {
  // system.ContextMenu.callMenu(e, [
  //   {
  //     name: "关闭",
  //     click: () => {
  //       DragWindowItem?.destroy()
  //     },
  //   },
  //   {
  //     name: "最小化",
  //     click: () => {
  //       DragWindowItem?.hide()
  //     },
  //   },
  // ]);
}

let customerStyle = ref<any>({});

function onFocus(e: MouseEvent | TouchEvent): void {
  browserWindow?.moveTop()
  if (isMaximize.value) {
    if (e instanceof MouseEvent) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}

let istop = computed(() => windowInfo.istop);
let isMaximize = computed(() => windowInfo.isMaximize);

/*
 *计算样式
 */
onMounted(() => {
  customerStyle.value = {
    width: computed(() => windowInfo.width + "px"),
    height: computed(() => windowInfo.height + "px"),
    left: computed(() => windowInfo.x + "px"),
    top: computed(() => windowInfo.y + "px"),

    zIndex: computed(() => {
      // TODO:
      // return browserWindow.zindex;
      return 3;

    }),
    // display: computed(() => {
    //   if (browserWindow.isVisible) {
    //     return "";
    //   } else {
    //     return "none";
    //   }
    // }),
  };


});

/*
挂载拖动事件
*/
let $win_outer = ref(null);
onMounted(() => {
  let dragAble = new DragElement($win_outer.value, windowInfo.x, windowInfo.y);
  watch(
    () => windowInfo.isMaximize,
    (n, o) => {
      if (n) {
        dragAble.canDrag = false;
      } else {
        dragAble.canDrag = true;
      }
    }
  );
  dragAble.onDrag((x, y) => {
    if (!windowInfo.isMaximize) {
      windowInfo.x = x;
      windowInfo.y = y;
    }
  });
});

/*
挂载缩放事件
*/
let resizable = ref(windowInfo.resizable);
let resizemode = ref("null");
let scaleAble: ScaleElement;
onMounted(() => {
  scaleAble = new ScaleElement(resizemode, windowInfo.width, windowInfo.height, windowInfo.x, windowInfo.y);
  scaleAble.onResize((width: number, height: number, x: number, y: number) => {
    windowInfo.width = width || windowInfo.width;
    windowInfo.height = height || windowInfo.height;
    windowInfo.x = x || windowInfo.x;
    windowInfo.y = y || windowInfo.y;
  });
})
function startScale(e: MouseEvent | TouchEvent, dire: string) {
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
  background-color: rgb(255, 255, 255);
  border: 1px solid #0078d7;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 0 1px rgb(246 246 247 / 92%),
    0 7px 19px rgb(0 0 0 / 58%);

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
  height: 100% !important;
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