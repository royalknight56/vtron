/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-01-27 18:35:47
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/DragWindow.ts
 * Need CodeReview 
 */
import { defineComponent, nextTick } from "vue";
import { WindowInfo, DWM } from "./DWM"

interface option {
    content: ReturnType<typeof defineComponent>,
    props?: any,
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    title?: string,
    icon?: string,
    isScalable?: boolean
}
interface EventMap {
    onDraging: { x: number, y: number, ifdrag: boolean }
    onResizing: { x: number, y: number }
}
type EventMapFunction = {
    [K in keyof EventMap]?: (ev: EventMap[K]) => any
};
class DragWindow {
    private evMap: EventMapFunction
    windowInfo: WindowInfo | null

    private option: option
    id: string
    private ifcreated: boolean

    constructor(option: option) {

        this.windowInfo = null;

        this.evMap = {};
        this.option = option

        this.id = 'NULL'
        this.ifcreated = false;


    }
    private getWinInner() {
        let dom = document.getElementById('win10id');
        if (dom) {
            return {
                width: dom.clientWidth,
                height: dom.clientHeight
            }
        } else {
            return {
                width: 0,
                height: 0
            }
        }

    }
    addWindowEventListener<K extends keyof EventMap>(event: K, callback: EventMapFunction[K]) {
        this.evMap[event] = callback;
    }

    private readyRegister() {
        let id = DWM.getInstance().getWinid();//获得一个id
        this.id = id
    }
    private register(option: option) {
        this.windowInfo = DWM.getInstance().registerWindow(this.id, option);//在IPC中注册，传递windowInfo
    }
    private makeWindowNotOverSize() {

        if (this.windowInfo) {
            if (this.windowInfo.isScalable) {
                let { x, y, width, height } = this.windowInfo;
                let { width: winWidth, height: winHeight } = this.getWinInner();
                if (x + width > winWidth) {
                    this.windowInfo.width = winWidth - x;
                }
                if (y + height > winHeight) {
                    this.windowInfo.height = winHeight - y;
                }
            }
        }
    }
    show() {
        if (!this.ifcreated && !this.windowInfo?.ifDestory) {
            this.readyRegister();
        }
        this.register(this.option);
        this.makeWindowNotOverSize();


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