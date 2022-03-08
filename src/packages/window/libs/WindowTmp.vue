<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-03-08 19:45:20
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/WindowTmp.vue
 Need CodeReview 
-->
<template>
    <div
        class="wintmp_outer dragwin"
        :style="customerStyle"
        @touchstart.passive="onFocus"
        @mousedown="onFocus"
        :class="{ topwin: iftop, maxwin: isMaximize }"
        ref="$win_outer"
    >
        <div class="wintmp_uper" @dblclick="maxWindow()" @contextmenu.prevent="uperRightClick">
            <div class="wintmp_left">
                <div class="wintmp_logo">
                    <img draggable="false" width="24" height="24" :src="ctx.icon" />
                </div>
                <div class="wintmp_title">{{ ctx.title }}</div>
            </div>
            <div class="winbutton_group">
                <div @click="hideWindow()" class="winbutton hide_button">
                    <svg class="icon" viewBox="0 0 1024 1024">
                        <path d="M128 512h768a25.6 25.6 0 1 1 0 51.2h-768a25.6 25.6 0 1 1 0-51.2z" />
                    </svg>
                </div>
                <div v-if="isScaleAble" @click="maxWindow()" class="winbutton max_button">
                    <svg v-if="isMaximize" class="icon" viewBox="0 0 1024 1024">
                        <path
                            d="M959.72 0H294.216a63.96 63.96 0 0 0-63.96 63.96v127.92H64.28A63.96 63.96 0 0 0 0.32 255.84V959.4a63.96 63.96 0 0 0 63.96 63.96h703.56a63.96 63.96 0 0 0 63.96-63.96V792.465h127.92a63.96 63.96 0 0 0 63.96-63.96V63.96A63.96 63.96 0 0 0 959.72 0zM767.84 728.505V959.4H64.28V255.84h703.56z m189.322 0H831.8V255.84a63.96 63.96 0 0 0-63.96-63.96H294.216V63.96H959.72z"
                        />
                    </svg>
                    <svg v-else class="icon" viewBox="0 0 1024 1024">
                        <path
                            d="M926.45937303 97.54062697v828.2973677H97.54062697V97.54062697h828.91874606m4.97102697-77.6722963h-838.8608c-39.7682157 0-72.07989097 32.31167525-72.07989097 72.07989096v839.48217837c0 39.7682157 32.31167525 72.07989097 72.07989097 72.07989097h839.48217837c39.7682157 0 72.07989097-32.31167525 72.07989096-72.07989097v-838.8608c0-40.38959408-32.31167525-72.70126933-72.70126933-72.70126933 0.62137837 0 0 0 0 0z"
                        />
                    </svg>
                </div>
                <!-- <svg t="1629857965098" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3294" width="200" height="200"><path d="M959.72 0H294.216a63.96 63.96 0 0 0-63.96 63.96v127.92H64.28A63.96 63.96 0 0 0 0.32 255.84V959.4a63.96 63.96 0 0 0 63.96 63.96h703.56a63.96 63.96 0 0 0 63.96-63.96V792.465h127.92a63.96 63.96 0 0 0 63.96-63.96V63.96A63.96 63.96 0 0 0 959.72 0zM767.84 728.505V959.4H64.28V255.84h703.56z m189.322 0H831.8V255.84a63.96 63.96 0 0 0-63.96-63.96H294.216V63.96H959.72z" p-id="3295"></path></svg> -->
                <div @click="closeWindow()" class="winbutton close_button">
                    <svg class="icon" viewBox="0 0 1024 1024">
                        <path
                            d="M566.97558594 521.09667969L856.8828125 231.18945312c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355468l-1.58203125-1.58203125c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0L512 466.51660156 222.09277344 176.21386719c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0l-1.58203125 1.58203125c-15.02929688 14.63378906-15.02929688 38.75976563 0 53.39355469l289.90722656 289.90722656L167.1171875 811.00390625c-14.63378906 14.63378906-14.63378906 38.75976563 0 53.39355469l1.58203125 1.58203125c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0L512 576.07226563 801.90722656 865.97949219c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0l1.58203125-1.58203125c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355469L566.97558594 521.09667969z"
                            fill="#363F4D"
                        />
                    </svg>
                </div>
            </div>
        </div>
        <div
            ref="winmount"
            class="wintmp_main"
            :class="{ resizeing: resizemode != 'null' }"
            @mousedown.stop="predown"
            @touchstart.stop.passive="predown"
        >
            <component :is="componentValue"></component>
            <!-- <div ></div> -->
        </div>
        <div
            class="right_border"
            v-if="isScaleAble"
            @mousedown.stop="startScale($event, 'r')"
            @touchstart.stop.passive="startScale($event, 'r')"
        ></div>
        <div
            class="bottom_border"
            v-if="isScaleAble"
            @mousedown.stop="startScale($event, 'b')"
            @touchstart.stop.passive="startScale($event, 'b')"
        ></div>
        <div
            class="right_bottom_border"
            v-if="isScaleAble"
            @mousedown.stop="startScale($event, 'rb')"
            @touchstart.stop.passive="startScale($event, 'rb')"
        ></div>
    </div>
</template>
<script lang="ts" setup>
import { markRaw, provide, reactive, ref, shallowRef, toRaw } from "vue";

import { onMounted, computed } from "vue";
import type { PropType } from "vue"

import { DWM,PrivateDWM } from "./DWM"
import type { WindowInfo } from "./DWM"
import { MenuCtrl } from "./MenuCtrl"

import { DragElement } from "./DragElement";
import { ScaleElement } from "./ScaleElement";

// import html2canvas from 'html2canvas';

let props = defineProps({

    ctx: {
        type: Object as PropType<WindowInfo>,
        default: {
            app: {
                unmount: () => {
                }
            },//创建的app
            content: {},//组件vue

        }
    }
})
let winID = props.ctx.id
function closeWindow(): void {
    PrivateDWM.getInstance().destoryWindow(winID)
}
function hideWindow() {
    PrivateDWM.getInstance().hideWindow(winID)
}
function maxWindow() {
    PrivateDWM.getInstance().maxWindow(winID)
}
function predown() {
    PrivateDWM.getInstance().upSetWindowIndex(winID)
}
function uperRightClick(e: MouseEvent) {
    MenuCtrl.getInstance().callMenu(e,
        [
            { name: '关闭', func: () => { PrivateDWM.getInstance().destoryWindow(winID) } },
            { name: '最小化', func: () => { PrivateDWM.getInstance().hideWindow(winID) } }

        ]
    )
}
let winmount = ref(null)


let customerStyle = ref<any>({})

function onFocus(e: MouseEvent | TouchEvent): void {
    PrivateDWM.getInstance().upSetWindowIndex(winID)
    if (isMaximize.value) {

        if (e instanceof MouseEvent) {
            e.preventDefault()
            e.stopPropagation()
        } else {
            // e.stopPropagation()
        }
    }
}

let componentValue: any = shallowRef(null)

let iftop = computed(() => props.ctx.iftop)
let isMaximize = computed(() => props.ctx.isMaximize)

let winWidth = ref(props.ctx.width)
let winHeight = ref(props.ctx.height)

/*
 *计算样式
 */
onMounted(() => {

    customerStyle.value = {
        width: computed(() => winWidth.value + 'px'),
        height: computed(() => winHeight.value + 'px'),
        zIndex: computed(() => {
            return props.ctx.zindex
        }),
        display: computed(() => {
            if (props.ctx.ifShow) {
                return ""
            } else {
                return "none"
            }
        }),
    }
    componentValue.value = toRaw(props.ctx).content;
    provide('windowId', winID)
})
/*
挂载拖动事件
*/
let $win_outer = ref(null);
let wininfo = PrivateDWM.getInstance().getWindow(winID)
onMounted(() => {
    let dragAble = new DragElement(wininfo.x, wininfo.y)
    dragAble.mountDomEvent($win_outer.value)
    dragAble.onDrag((x,y)=>{
        // console.log(x,y)
        PrivateDWM.getInstance().getWindow(winID).x=x;
        PrivateDWM.getInstance().getWindow(winID).y=y;

        // wininfo.x=x;
        // wininfo.y=y
    })
})


/*
挂载缩放事件
*/
let isScaleAble = ref(wininfo.isScalable)
let resizemode = ref('null')
let scaleAble = new ScaleElement(resizemode, winWidth, winHeight);

scaleAble.onResize((width:number,height:number)=>{
    PrivateDWM.getInstance().scaleChange(winID,width,height)
})
function startScale(e: MouseEvent | TouchEvent, dire: string) {
    scaleAble?.startScale(e, dire)
}


</script>
<style>
.dragwin {
    position: absolute;
    width: 100%;
    height: 100%;
}
</style>
<style scoped>
@import "../../main.css";
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
    contain: content;
}
.topwin {
    border: 1px solid #0078d7;
    box-shadow: inset 0 0 0 1px rgb(246 246 247 / 92%),
        0 7px 19px rgb(0 0 0 / 90%);
}
.maxwin {
    position: absolute;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: calc(100% - 30px) !important;
    transition: width 0.1s ease-in-out, height 0.1s ease-in-out;
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
.wintmp_main {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: rgb(255, 255, 255);
    overflow: hidden;
}
.winbutton_group {
    display: flex;
    position: absolute;
    top: 0;
    right: 0;
}
.icon {
    width: 12px;
    height: 12px;
}
.winbutton {
    cursor: pointer;
    height: 30px;
    width: 35px;
    background-color: rgba(149, 182, 243, 0);
    text-align: center;
    transition: all 0.1s;

    background: #ffffff;
    font-family: "Segoe UI", Tahoma, sans-serif;
    font-size: 12px;
    border: 2px solid white;
    padding: 0px 4px;
    transition: 0.1s;
}
.winbutton:hover {
    background-color: rgb(200, 217, 245);
    color: white;
}
.close_button {
    /* position: absolute;
    right: 0;
    top: 0; */
}
.close_button:hover {
    background-color: red;
}
.hide_button {
    /* position: absolute;
    right: 35px;
    top: 0; */
    text-align: center;
}
.max_button {
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