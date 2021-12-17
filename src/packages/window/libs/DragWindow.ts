/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-12-16 20:16:21
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/DragWindow.ts
 */
import { createApp, defineComponent, nextTick } from "vue";
import { DragElement } from "./DragElement";
import WindowTmpVue from "./WindowTmp.vue";


import { WindowInfo, WindowIPC } from "./WindowIPC"
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
    constructor(option: option, use?: any) {

        super(option.x || 0, option.y || 0)
        this.windowInfo = null;
        this.el = null;

        this.evMap = {};

        this.title = option.title || '未命名窗口';
        this.icon = option.icon || ''
        this.width = option.width || 400;
        this.height = option.height || 400;
        this.option = option
        this.use = use
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
        // let div = document.createElement('div')

        // let id = WindowIPC.getInstance().getWinid();//获得一个id
        // div.id = id
        // this.id = id

        console.log(this.id)
        this.el = <HTMLDivElement>document.getElementById(this.id);
        return
    }
    readyRegister(title: string, icon: string = '', width: number, height: number, option: option, use?: any) {
        let id = WindowIPC.getInstance().getWinid();//获得一个id
        this.id = id

        this.windowInfo = WindowIPC.getInstance().registerWindow(this.id, title, icon, width, height, option.content, option.props);//在IPC中注册，传递windowInfo
        // this.appPointer = createApp(WindowTmpVue, { ctx: this.windowInfo })//模版中可以接受到windowInfo

        if (use) {

            for (let i = 0; i < use.length; i++) {
                // this.appPointer.use(use[i])
            }
        }
    }
    show() {
        this.readyRegister(this.title, this.icon, this.width, this.height, this.option, this.use);
        setTimeout(() => {
            console.log(!this.ifcreated ,this.windowInfo?.ifDestory)
            if (!this.windowInfo?.ifDestory) {


                
                this.readyDom();
                console.log(this.el)
                if (this.appPointer) {

                    // this.appPointer.mount(this.el);

                    WindowIPC.getInstance().mountWindowEventMap(this.id, 'destroy', () => {
                        // this.appPointer?.unmount()
                    })
                    WindowIPC.getInstance().mountWindowEventMap(this.id, 'resize', (x: number, y: number) => {
                        this.evMap.onResizing?.(x, y)
                    })
                }

                if (this.el) {
                    this.mountDomEvent(this.el)
                }

                WindowIPC.getInstance().upSetWindowIndex(this.id)
                this.ifcreated = true;
            }
        })

    }
}
export {
    DragWindow
}