<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-11-19 18:55:12
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/WindowTmp.vue
-->
<template>
    <div
        class="wintmp_outer dragwin"
        :style="customerStyle"
        @touchstart.passive="onFocus"
        @mousedown="onFocus"
        :class="{ topwin: iftop, maxwin: ifmax }"
    >
        <div class="wintmp_uper" @dblclick="maxWindow()" @contextmenu.prevent="uperRightClick">
            <div class="wintmp_left">
                <div class="wintmp_logo">
                    <img width="24" height="24" :src="ctx.icon" />
                </div>
                <div class="wintmp_title">{{ ctx.title }}</div>
            </div>
            <div class="winbutton_group">
                <div @click="hideWindow()" class="winbutton hide_button">
                    <svg
                        t="1629858033723"
                        class="icon"
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        p-id="3845"
                        width="12"
                        height="12"
                    >
                        <path
                            d="M128 512h768a25.6 25.6 0 1 1 0 51.2h-768a25.6 25.6 0 1 1 0-51.2z"
                            p-id="3846"
                        />
                    </svg>
                </div>
                <div @click="maxWindow()" class="winbutton max_button">
                    <svg
                        v-if="ifmax"
                        t="1629857965098"
                        class="icon"
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        p-id="3294"
                        width="12"
                        height="12"
                    >
                        <path
                            d="M959.72 0H294.216a63.96 63.96 0 0 0-63.96 63.96v127.92H64.28A63.96 63.96 0 0 0 0.32 255.84V959.4a63.96 63.96 0 0 0 63.96 63.96h703.56a63.96 63.96 0 0 0 63.96-63.96V792.465h127.92a63.96 63.96 0 0 0 63.96-63.96V63.96A63.96 63.96 0 0 0 959.72 0zM767.84 728.505V959.4H64.28V255.84h703.56z m189.322 0H831.8V255.84a63.96 63.96 0 0 0-63.96-63.96H294.216V63.96H959.72z"
                            p-id="3295"
                        />
                    </svg>
                    <svg
                        v-else
                        t="1629857441097"
                        class="icon"
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        p-id="3141"
                        width="12"
                        height="12"
                    >
                        <path
                            d="M926.45937303 97.54062697v828.2973677H97.54062697V97.54062697h828.91874606m4.97102697-77.6722963h-838.8608c-39.7682157 0-72.07989097 32.31167525-72.07989097 72.07989096v839.48217837c0 39.7682157 32.31167525 72.07989097 72.07989097 72.07989097h839.48217837c39.7682157 0 72.07989097-32.31167525 72.07989096-72.07989097v-838.8608c0-40.38959408-32.31167525-72.70126933-72.70126933-72.70126933 0.62137837 0 0 0 0 0z"
                            p-id="3142"
                        />
                    </svg>
                </div>
                <!-- <svg t="1629857965098" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3294" width="200" height="200"><path d="M959.72 0H294.216a63.96 63.96 0 0 0-63.96 63.96v127.92H64.28A63.96 63.96 0 0 0 0.32 255.84V959.4a63.96 63.96 0 0 0 63.96 63.96h703.56a63.96 63.96 0 0 0 63.96-63.96V792.465h127.92a63.96 63.96 0 0 0 63.96-63.96V63.96A63.96 63.96 0 0 0 959.72 0zM767.84 728.505V959.4H64.28V255.84h703.56z m189.322 0H831.8V255.84a63.96 63.96 0 0 0-63.96-63.96H294.216V63.96H959.72z" p-id="3295"></path></svg> -->
                <div @click="closeWindow()" class="winbutton close_button">
                    <svg
                        t="1629858066563"
                        class="icon"
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        p-id="4652"
                        width="12"
                        height="12"
                    >
                        <path
                            d="M566.97558594 521.09667969L856.8828125 231.18945312c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355468l-1.58203125-1.58203125c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0L512 466.51660156 222.09277344 176.21386719c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0l-1.58203125 1.58203125c-15.02929688 14.63378906-15.02929688 38.75976563 0 53.39355469l289.90722656 289.90722656L167.1171875 811.00390625c-14.63378906 14.63378906-14.63378906 38.75976563 0 53.39355469l1.58203125 1.58203125c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0L512 576.07226563 801.90722656 865.97949219c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0l1.58203125-1.58203125c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355469L566.97558594 521.09667969z"
                            fill="#363F4D"
                            p-id="4653"
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
            @touchstart.stop="predown"
        >
            <component :is="componentValue" :id='props.ctx.id'></component>
            <!-- <div ></div> -->
        </div>
        <div class="right_border" @mousedown.stop="dragStart($event, 'r')" @touchstart.stop="dragStart($event, 'r')"></div>
        <div class="bottom_border" @mousedown.stop="dragStart($event, 'b')" @touchstart.stop="dragStart($event, 'b')"></div>
        <div class="right_bottom_border" @mousedown.stop="dragStart($event, 'rb')" @touchstart.stop="dragStart($event, 'rb')"></div>
    </div>
</template>
<script lang="ts" setup>
import { markRaw, reactive, ref, shallowRef, toRaw } from "vue";

import { onMounted, computed } from "vue";
import type { PropType } from "vue"


import { WindowIPC } from "./WindowIPC"
import type { PageItem } from "./WindowIPC"
import { MenuIPC } from "../libs/MenuIPC"


let props = defineProps({

    ctx: {
        type: Object as PropType<PageItem>,
        default: {
            app: {
                unmount: () => {
                }
            },//创建的app
            content: {},//组件vue

        }
    }
})

function closeWindow(): void {
    WindowIPC.getInstance().destoryWindow(props.ctx.id)
}
function hideWindow() {
    WindowIPC.getInstance().hideWindow(props.ctx.id)
}
function maxWindow() {
    console.log("maxWindow")
    WindowIPC.getInstance().maxWindow(props.ctx.id)
}
function predown() {
    WindowIPC.getInstance().upSetWindowIndex(props.ctx.id)
}
function uperRightClick(e: MouseEvent) {
    MenuIPC.getInstance().callMenu(e.pageX, e.pageY,
        [
            { name: '关闭', func: () => { WindowIPC.getInstance().destoryWindow(props.ctx.id) } },
            { name: '最小化', func: () => { WindowIPC.getInstance().hideWindow(props.ctx.id) } }

        ]
    )
}
let winmount = ref(null)


let customerStyle = ref<any>({})

function onFocus(e: MouseEvent|TouchEvent): void {
    console.log("focus")
    WindowIPC.getInstance().upSetWindowIndex(props.ctx.id)
    if (ifmax.value) {
        
        if(e instanceof MouseEvent) {
            e.preventDefault()
            e.stopPropagation()
        }else{
            e.stopPropagation()
        }
    }
}

let componentValue: any = shallowRef(null)

let iftop = computed(() => props.ctx.iftop)
let ifmax = computed(() => props.ctx.ifMax)

let winWidth = ref(props.ctx.width)
let winHeight = ref(props.ctx.height)

onMounted(() => {

    customerStyle.value = {
        width: computed(() => winWidth.value + 'px'),
        height: computed(() => winHeight.value + 'px'),
        zIndex: computed(() => {
            return props.ctx.zindex
        }),
        visibility: computed(() => {
            if (props.ctx.ifShow) {
                return "visible"
            } else {
                return "hidden"
            }
        }),
    }
    componentValue.value = toRaw(props.ctx).content;
})

let resizemode = ref('null')
let mosStartX = ref(0);
let mosStartY = ref(0);

let winStartX = ref(0);
let winStartY = ref(0);

function moveListener(e: MouseEvent|TouchEvent){
    
    if (e instanceof MouseEvent) {
        if(e.buttons == 1) {

        } else {
            return
        }
    }
    let pageX = 0;
    let pageY = 0;
    if (e instanceof MouseEvent) {
        pageX = e.pageX;
        pageY = e.pageY;
    }else{
        pageX = e.touches[0].pageX;
        pageY = e.touches[0].pageY;
    }
    
    if (resizemode.value == 'r') {
        winWidth.value = winStartX.value + pageX - mosStartX.value
        if (winWidth.value < 170) {
            winWidth.value = 170
        } else {
            props.ctx.windowEventMap['resize']?.(winWidth.value,winHeight.value)
        }
    } else if (resizemode.value == 'b') {
        winHeight.value = winStartY.value + pageY - mosStartY.value
        if (winHeight.value < 100) {
            winHeight.value = 100
        } else {
            props.ctx.windowEventMap['resize']?.(winWidth.value,winHeight.value)
        }
    } else if (resizemode.value == 'rb') {
        winWidth.value = winStartX.value + pageX - mosStartX.value
        winHeight.value = winStartY.value + pageY - mosStartY.value
        if (winWidth.value < 170) {
            winWidth.value = 170
            if (winHeight.value < 100) {
                winHeight.value = 100
            } else {
                props.ctx.windowEventMap['resize']?.(winWidth.value,winHeight.value)
            }
        } else {
            if (winHeight.value < 100) {
                winHeight.value = 100
            }
            props.ctx.windowEventMap['resize']?.(winWidth.value,winHeight.value)
        }

    } else {
        return
    }
    // e.preventDefault()
    // e.stopPropagation()
}
document.addEventListener("touchmove", moveListener)
document.addEventListener('mousemove', moveListener)
document.addEventListener("mouseup", () => {
    resizemode.value = 'null'
})
document.addEventListener("touchend", () => {
    resizemode.value = 'null'
})
function dragStart(e: MouseEvent|TouchEvent, dire: string) {
    resizemode.value = dire
    if(e instanceof MouseEvent){
        mosStartX.value = e.pageX
        mosStartY.value = e.pageY
    }else{
        mosStartX.value = e.touches[0].pageX
        mosStartY.value = e.touches[0].pageY
    }
    winStartX.value = winWidth.value
    winStartY.value = winHeight.value

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
    width: 10px;
    height: 100%;
}
.bottom_border {
    cursor: ns-resize;
    position: absolute;
    bottom: -12px;
    background-color: rgba(0, 0, 0, 0);
    width: 100%;
    height: 10px;
}
.right_bottom_border {
    cursor: nwse-resize;
    position: absolute;
    right: -12px;
    bottom: -12px;
    background-color: rgba(0, 0, 0, 0);
    width: 10px;
    height: 10px;
}
.resizeing {
    user-select: none;
    pointer-events: none;
}
</style>