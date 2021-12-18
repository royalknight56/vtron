/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-12-16 20:16:21
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/DragWindow.ts
 */
import { createApp, defineComponent, nextTick } from "vue";
import { DragElement } from "./DragElement";
import WindowTmpVue from "./WindowTmp.vue";


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
}
class DragWindow extends DragElement {
    evMap: {
        onDraging?: Function
        onResizing?: (x: number, y: number) => void
    }
    windowInfo: WindowInfo | null
    el: HTMLDivElement | null
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

        super(option.x || 0, option.y || 0)
        this.windowInfo = null;
        this.el = null;

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
    readyDom() {
        this.el = <HTMLDivElement>document.getElementById(this.id);
        return this.el;
    }
    readyRegister(title: string, icon: string = '', width: number, height: number, option: option, use?: any) {
        let id = DWM.getInstance().getWinid();//获得一个id
        this.id = id
        this.windowInfo = DWM.getInstance().registerWindow(this.id, title, icon, width, height, option.content, option.props);//在IPC中注册，传递windowInfo

    }
    show() {
        this.readyRegister(this.title, this.icon, this.width, this.height, this.option, this.use);
        setTimeout(() => {
            if (!this.windowInfo?.ifDestory) {

                this.readyDom();

                if (this.el) {
                    this.mountDomEvent(this.el)
                }

                DWM.getInstance().upSetWindowIndex(this.id)
                this.ifcreated = true;
            }
        })

    }
}
export {
    DragWindow
}