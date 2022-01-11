/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-01-11 16:12:27
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/DragWindow.ts
 * Need CodeReview 
 */
import { defineComponent, nextTick } from "vue";
// import { DragElement } from "./DragElement";
// import WindowTmpVue from "./WindowTmp.vue";


import { WindowInfo, DWM } from "./DWM"
import type { DefineComponent, App } from "vue";

interface option {
    content: ReturnType<typeof defineComponent>,
    props?: any,
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    title?: string,
    icon?: string,
    isScalable?:boolean
}
class DragWindow {
    evMap: {
        onDraging?: Function
        onResizing?: (x: number, y: number) => void
    }
    windowInfo: WindowInfo | null

    option: option
    id: string
    ifcreated: boolean

    constructor(option: option) {

        this.windowInfo = null;

        this.evMap = {};
        this.option = option

        this.id = 'NULL'
        this.ifcreated = false;

    }
    onWindowDraging(event: Function) {
        this.evMap.onDraging = event;
    }
    onWindowResizing(event: (x: number, y: number) => void) {
        this.evMap.onResizing = event;
    }

    readyRegister() {
        let id = DWM.getInstance().getWinid();//获得一个id
        this.id = id
    }
    register(option: option) {
        this.windowInfo = DWM.getInstance().registerWindow(this.id,option);//在IPC中注册，传递windowInfo
    }
    show() {
        if (!this.ifcreated && !this.windowInfo?.ifDestory) {
            this.readyRegister();
        }
        this.register( this.option);

        nextTick(() => {
            DWM.getInstance().upSetWindowIndex(this.id)
            this.ifcreated = true;
        })

    }
}
export {
    DragWindow,
    option
}