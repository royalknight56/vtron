/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-12-28 21:11:27
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
    title: string
    icon: string
    width: number
    height: number

    option: option
    use?: any
    id: string
    ifcreated: boolean
    appPointer: App | null
    constructor(option: option) {

        // super(option.x || 0, option.y || 0)
        this.windowInfo = null;

        this.evMap = {};

        this.title = option.title || '未命名窗口';
        this.icon = option.icon || ''
        this.width = option.width || 400;
        this.height = option.height || 400;
        this.option = option
        this.id = 'NULL'
        this.ifcreated = false;
        this.appPointer = null;
        // this.show()

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