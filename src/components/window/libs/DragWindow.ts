/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-09-18 16:39:16
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/DragWindow.ts
 */
import { createApp, defineComponent } from "vue";
import { DragElement } from "./DragElement";
import WindowTmpVue from "./WindowTmp.vue";


import { PageItem, WindowIPC } from "./WindowIPC"
import type { DefineComponent } from "vue";



interface ctxInter {

    IPC: PageItem,
    props?: any
}
interface ctxPar {
    content: ReturnType<typeof defineComponent>,
    //DefineComponent<{}, {}, any>
    // use?: Array<any>,
    props?: any
}
class DragWindow extends DragElement {
    evMap: {
        onDraging?: Function
        onResizing?: Function
    }
    pageInfo: PageItem | null
    el: HTMLDivElement | null
    title: string
    icon: string
    width: number
    height: number
    ctxpar: ctxPar
    use?: any
    id: string
    ifcreated: boolean
    constructor(x: number, y: number, title: string, icon: string, width: number, height: number, ctxpar: ctxPar, use?: any) {

        super(x, y)
        this.pageInfo = null;
        this.el = null;

        this.evMap = {};

        this.title = title
        this.icon = icon
        this.width = width
        this.height = height
        this.ctxpar = ctxpar
        this.use = use
        this.id = 'NULL'
        this.ifcreated = false;
        // this.show()
    }
    onWindowDraging(event: Function) {
        this.evMap.onDraging = event;
    }
    onWindowResizing(event: Function) {
        this.evMap.onResizing = event;
    }
    readyDom() {
        let div = document.createElement('div')

        let id = WindowIPC.getInstance().getWinid();//获得一个id
        div.id = id
        this.id = id
        document.getElementById('winid')?.appendChild(div);

        this.el = div
        return div
    }
    readyRegister(title: string, icon: string = '', width: number, height: number, ctxpar: ctxPar, use?: any) {
        this.pageInfo = WindowIPC.getInstance().registerWindow(this.id, title, icon, width, height, ctxpar.content, ctxpar.props);//在IPC中注册，传递pageInfo
        this.pageInfo.appPointer = createApp(WindowTmpVue, { ctx: this.pageInfo })
        if (use) {

            for (let i = 0; i < use.length; i++) {
                this.pageInfo.appPointer.use(use[i])
            }
        }

        this.pageInfo.appPointer.config.warnHandler = function (msg, vm, trace) {//未接受props警告静默
            // `trace` 是组件的继承关系追踪
            if (msg == 'Extraneous non-props attributes (ctx) were passed to component but could not be automatically inherited because component renders fragment or text root nodes.') {

            } else {
                console.warn(msg)
            }
        }
    }
    show() {
        
        if (!this.ifcreated||this.pageInfo?.ifDestory) {
            // delete this.pageInfo
            // if(this.id!='NULL'){
            //     this.unMountDomEvent()
            // }
            this.readyDom();
            this.readyRegister(this.title, this.icon, this.width, this.height, this.ctxpar, this.use);
            if (this.pageInfo?.appPointer) {

                this.pageInfo.appPointer.mount(this.el);

            }
            WindowIPC.getInstance().mountWindow(this.id, this.pageInfo?.appPointer)
            if (this.el) {
                this.mountDomEvent(this.el.firstChild)
            }

            WindowIPC.getInstance().upSetWindowIndex(this.id)
            this.ifcreated=true;
        }
        

    }
}
export {
    DragWindow,
    ctxInter
}