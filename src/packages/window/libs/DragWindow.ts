/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-01-27 18:35:47
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/DragWindow.ts
 * Need CodeReview 
 */
import { defineComponent, nextTick } from "vue";
import { WindowInfo, DWM, PrivateDWM } from "./DWM"

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

    private option: Required<option>
    id: string
    private ifcreated: boolean

    constructor(option: option) {

        this.windowInfo = null;

        this.evMap = {};
        this.option = Object.assign({
            x: 0,
            y: 0,
            width: 400,
            height: 400,
            props: {},
            icon: 'data:image/png;base64,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',
            isScalable: true,
            title: "未命名窗口"
        }, option)
        this.id = 'NULL'
        this.ifcreated = false;
    }
    private setOption(option: Partial<option>): Required<option> {
        this.option = Object.assign(this.option, option)
        return this.option

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
        let id = PrivateDWM.getInstance().getWinid();//获得一个id
        this.id = id
    }
    private register(option: Required<option>) {
        this.windowInfo = PrivateDWM.getInstance().registerWindow(this.id, option);//在IPC中注册，传递windowInfo
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
    show(option?: Partial<option>) {// 调用show之后，注册窗口
        if (!this.ifcreated && !this.windowInfo?.ifDestory) {
            this.readyRegister();//在窗口是第一次注册时，获取一个唯一id
        }
        if (option) {
            this.register(this.setOption(option));//注册窗口，传入选项

        } else {
            this.register(this.option);//注册窗口，传入选项

        }
        this.makeWindowNotOverSize();// 使得窗口在生成时，不超过屏幕


        nextTick(() => {
            PrivateDWM.getInstance().upSetWindowIndex(this.id)
            this.ifcreated = true;
        })

    }
}
export {
    DragWindow,
    option
}