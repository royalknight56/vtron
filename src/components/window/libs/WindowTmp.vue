<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-06 11:03:00
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/WindowTmp.vue
-->
<template class='win'>
    <div class="outer" :style="customerStyle" @mousedown="onFocus" :class="{ topwin: iftop }">
        <div class="uper" @contextmenu.prevent="uperRightClick">
            <div class="title">{{ title }}</div>
            <div @click="hideWindow()" class="winbutton hide_button">_</div>
            <div @click="closeWindow()" class="winbutton close_button">✕</div>
        </div>
        <div ref="winmount" class="main" :class="{resizeing:resizemode!='null'}" @mousedown.stop="predown">
            <!-- <div ></div> -->
        </div>
        <div class="right_border" @mousedown.stop="dragStart($event,'r')">

        </div>
        <div class="bottom_border" @mousedown.stop="dragStart($event,'b')">
            
        </div>
    </div>
</template>
<script lang="ts" setup>
import { reactive, ref } from "@vue/reactivity";
import type { Ref } from "@vue/reactivity"
import type { ToRefs } from "@vue/reactivity";
import { computed, nextTick, onMounted, watch, } from "@vue/runtime-core";
import type { PropType } from "@vue/runtime-core"
import { createApp } from "@vue/runtime-dom";

import { WindowIPC } from "./WindowIPC"
import type { PageItem } from "./WindowIPC"
import { MenuIPC } from "../libs/MenuIPC"

interface appint {
    value: {
        unmount: Function
    },
    content: Object
    zindex: Ref<number>
    IPC: PageItem
}
let props = defineProps({
    title: {
        type: String,
        default: 'w1'
    },
    width: {
        type: Number,
        default: 300
    },
    height: {
        type: Number,
        default: 300
    },
    app: {
        type: Object as PropType<appint>,
        default: {
            value: {
                unmount: () => {
                }
            },
            content: {},
            zindex: ref(0)
        }
    }
})

function closeWindow(): void {
    WindowIPC.getInstance().destoryWindow(props.app.IPC.id)
    // props.app.value.unmount()
}
function hideWindow() {
    WindowIPC.getInstance().hideWindow(props.app.IPC.id)
}
function predown() {
    WindowIPC.getInstance().upSetWindowIndex(props.app.IPC.id)
}
function uperRightClick(e: MouseEvent) {
    MenuIPC.getInstance().callMenu(e.pageX, e.pageY,
        [
            { name: '关闭', func: () => { WindowIPC.getInstance().destoryWindow(props.app.IPC.id) } },
            { name: '最小化', func: () => { WindowIPC.getInstance().hideWindow(props.app.IPC.id) } }

        ]
    )
}
let winmount = ref(null)


let customerStyle = ref<any>({})

function onFocus() {
    WindowIPC.getInstance().upSetWindowIndex(props.app.IPC.id)
}

let iftop = computed(() => props.app.IPC.iftop)

let winWidth = ref(props.width)
let winHeight = ref(props.height)
onMounted(() => {

    customerStyle.value = {
        width: computed(() => winWidth.value + 'px'),
        height: computed(() =>winHeight.value + 'px'),
        zIndex: computed(() => {
            return props.app.IPC.zindex
        }),
        visibility: computed(() => {

            if (props.app.IPC.ifDestory) {
                // WindowIPC.getInstance().unRegisterWindow(props.app.IPC.id)
                props.app.value.unmount()
            }

            if (props.app.IPC.ifShow) {
                return "visible"
            } else {
                return "hidden"
            }
        }),
    }

    createApp(props.app.content).mount(<Element><any>winmount.value)
})
let resizemode = ref('null')
let mosStartX=ref(0);
let mosStartY=ref(0);

let winStartX=ref(0);
let winStartY=ref(0);
document.addEventListener('mousemove',(e)=>{
    if(e.buttons==1){

    }else{
        return
    }
    if(winWidth.value<100){
        winWidth.value=100
        resizemode.value='null'
        return
    }
    if(winHeight.value<100){
        winHeight.value=100
        resizemode.value='null'
        return
    }
    if(resizemode.value=='r'){
        winWidth.value = winStartX.value+ e.pageX-mosStartX.value
    }else if(resizemode.value=='b'){
        winHeight.value = winStartY.value+ e.pageY-mosStartY.value
    }else{
        return
    }
    // e.preventDefault()
    // e.stopPropagation()
})
document.addEventListener("mouseup",()=>{
    resizemode.value='null'
})
function dragStart(e:MouseEvent,dire:string) {
    resizemode.value=dire
    mosStartX.value=e.pageX
    mosStartY.value=e.pageY

    winStartX.value=winWidth.value
    winStartY.value=winHeight.value

}

</script>
<style>
.dragwin {
    position: absolute;
}
</style>
<style scoped>
.outer {
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
    border: 2px solid rgb(194, 194, 194);;

    display: flex;
    flex-direction: column;

    /**/
    border: #0078D7;
    border-width: 1px;
    border-style: solid;
    box-shadow: inset 0 0 0 1px rgb(246 246 247 / 92%), 0 7px 19px rgb(0 0 0 / 58%);
    padding: 0px;


}
.topwin {
    border: 1px solid #0078D7;
    box-shadow: inset 0 0 0 1px rgb(246 246 247 / 92%), 0 7px 19px rgb(0 0 0 / 90%);
}
.topwin .uper {
    /* background-color: rgba(192, 192, 192, 0.795); */
}
.uper {
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
.title {
    padding: 0 10px;
    color: black;
    font-family: 'Segoe UI', Tahoma, sans-serif;
    font-weight: 400;
    font-size: 12px;
    display: inline;
    padding: 20px;
}
.main {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: rgb(255, 255, 255);
    overflow: hidden;
}
.winbutton {
    cursor: pointer;
    height: 30px;
    width: 30px;
    background-color: rgba(149, 182, 243, 0);
    text-align: center;
    transition: all 0.1s;

    background: #FFFFFF;
    font-family: 'Segoe UI', Tahoma, sans-serif;
    font-size: 12px;
    border: 2px solid white;
    padding: 0px 4px;
    transition: 0.1s;
}
.winbutton:hover {
    background-color: rgb(149, 182, 243);
    color: white;
}
.close_button {
    position: absolute;
    right: 0;
    top: 0;
}
.close_button:hover{
    background-color: red;
}
.hide_button {
    position: absolute;
    right: 30px;
    top: 0;
}

.right_border{
    cursor: ew-resize;
    position: absolute;
    right: -12px;
    background-color: rgba(0, 0, 0, 0);
    width: 10px;
    height: 100%;
}
.bottom_border{
    cursor: ns-resize;
    position: absolute;
    bottom: -12px;
    background-color: rgba(0, 0, 0, 0);
    width: 100%;
    height: 10px;
}
.resizeing{
    user-select: none;
    pointer-events: none;
}
</style>