<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-18 19:13:13
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/WindowTmp.vue
-->
<template>
    <div class="wintmp_outer" :style="customerStyle" @mousedown="onFocus" :class="{ topwin: iftop }">
        <div class="wintmp_uper" @contextmenu.prevent="uperRightClick">
            <div class="wintmp_title">{{ ctx.title }}</div>
            <div @click="hideWindow()" class="winbutton hide_button">_</div>
            <div @click="closeWindow()" class="winbutton close_button">✕</div>
        </div>
        <div
            ref="winmount"
            class="wintmp_main"
            :class="{ resizeing: resizemode != 'null' }"
            @mousedown.stop="predown"
        >
        <component :is="componentValue" :ctx='props.ctx'></component>
            <!-- <div ></div> -->
        </div>
        <div class="right_border" @mousedown.stop="dragStart($event, 'r')"></div>
        <div class="bottom_border" @mousedown.stop="dragStart($event, 'b')"></div>
        <div class="right_bottom_border" @mousedown.stop="dragStart($event, 'rb')"></div>
    </div>
</template>
<script lang="ts" setup>
import { markRaw, reactive, ref, shallowRef, toRaw } from "vue";
 
import { onMounted,computed } from "vue";
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

function onFocus() {
    WindowIPC.getInstance().upSetWindowIndex(props.ctx.id)
}

let componentValue:any =shallowRef(null)

let iftop = computed(() => props.ctx.iftop)

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
    //IPC下移一层？不能这样
    // if(props.app.props){
    //     props.app.props.IPC=props.app.IPC
    // }else{
    //     props.app.props={}
    //     props.app.props.IPC=props.app.IPC
    // }
    componentValue.value=toRaw(props.ctx).content;
})
setTimeout(()=>{
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
    componentValue.value=toRaw(props.ctx).content;
},1000)
let resizemode = ref('null')
let mosStartX = ref(0);
let mosStartY = ref(0);

let winStartX = ref(0);
let winStartY = ref(0);
document.addEventListener('mousemove', (e) => {
    if (e.buttons == 1) {

    } else {
        return
    }
    if (winWidth.value < 100) {
        winWidth.value = 100
        resizemode.value = 'null'
        return
    }
    if (winHeight.value < 100) {
        winHeight.value = 100
        resizemode.value = 'null'
        return
    }
    if (resizemode.value == 'r') {
        winWidth.value = winStartX.value + e.pageX - mosStartX.value
    } else if (resizemode.value == 'b') {
        winHeight.value = winStartY.value + e.pageY - mosStartY.value
    } else if (resizemode.value == 'rb') {
        winWidth.value = winStartX.value + e.pageX - mosStartX.value
        winHeight.value = winStartY.value + e.pageY - mosStartY.value
    } else {
        return
    }
    // e.preventDefault()
    // e.stopPropagation()
})
document.addEventListener("mouseup", () => {
    resizemode.value = 'null'
})
function dragStart(e: MouseEvent, dire: string) {
    resizemode.value = dire
    mosStartX.value = e.pageX
    mosStartY.value = e.pageY

    winStartX.value = winWidth.value
    winStartY.value = winHeight.value

}

</script>
<style>
.dragwin {
    position: absolute;
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

.wintmp_uper {
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
}
.wintmp_title {
    padding: 0 10px;
    color: black;
    font-family: "Segoe UI", Tahoma, sans-serif;
    font-weight: 400;
    font-size: 12px;
    display: inline;
    padding: 20px;
}
.wintmp_main {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: rgb(255, 255, 255);
    overflow: hidden;
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
    background-color: rgba(149, 182, 243, 0.356);
    color: white;
}
.close_button {
    position: absolute;
    right: 0;
    top: 0;
}
.close_button:hover {
    background-color: red;
}
.hide_button {
    position: absolute;
    right: 35px;
    top: 0;
    text-align: center;
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