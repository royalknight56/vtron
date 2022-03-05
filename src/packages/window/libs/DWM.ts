/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-01-17 16:06:50
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/DWM.ts
 * Need CodeReview 
 */
import { reactive } from "vue";
import { UnwrapNestedRefs } from "@vue/reactivity";
import { option } from "./DragWindow";


interface WindowInfo extends Required<option> {
    //内建属性
    id: string,
    wid: number,
    zindex: number,
    ifShow: boolean,
    iftop: boolean,
    ifDestory: boolean,
    isMaximize: boolean,

    windowEventMap: {
        [index: string]: Function
    },

}

interface windowInfoMapInter {
    [index: string]: WindowInfo
}
interface eventMapInter {
    [index: string]: Function
}
class DWM {
    private static instance: DWM;
    private winnum: number;
    windowInfoMap: UnwrapNestedRefs<windowInfoMapInter>;
    private zIndexIdArray: string[];
    private eventMap: eventMapInter;
    private constructor() {
        this.winnum = 0;
        this.windowInfoMap = reactive({});
        this.zIndexIdArray = [];
        this.eventMap = {}
    }
    static getInstance() {
        if (this.instance == undefined) {
            this.instance = new DWM()
        }
        return this.instance
    }


    getWindow(id: string): WindowInfo {
        return this.windowInfoMap[id]
    }

    private getWinnum() {
        return this.winnum
    }
    getWinid(): string {
        return "dragwinelementhash89103" + this.getWinnum()
    }
    registerWindow(id: string,
        option: Required<option>
    ): WindowInfo {
        // 注册窗口，填入到windowInfoMap中
        if (this.windowInfoMap[id]) {
            return this.windowInfoMap[id]
        } else {
            this.windowInfoMap[id] = reactive({
                id,
                wid: this.winnum,
                zindex: 0,
                ifShow: true,
                iftop: false,
                ifDestory: false,
                isMaximize: false,

                x: option.x,
                y: option.y,
                width: option.width,
                height: option.height,
                isScalable: option.isScalable,
                title: option.title,
                icon: option.icon,

                content: option.content,
                props: option.props,

                windowEventMap: {}
            });

            this.zIndexIdArray.push(id) // 层级数组中压入id
            this.winnum++;
            return this.windowInfoMap[id]
        }
    }
    addEventListener(id: string, name: string, func: Function) {
        this.windowInfoMap[id].windowEventMap[name] = func
    }
    private unRegisterWindow(id: string) {//删除在windowInfoMap中的存储
        delete this.windowInfoMap[id]
        let ind = this.zIndexIdArray.indexOf(id)
        this.zIndexIdArray.splice(ind, 1)
    }


    upSetWindowIndex(id: string): number {
        for (let key in this.windowInfoMap) {
            this.windowInfoMap[key].iftop = false
        }
        this.windowInfoMap[id].iftop = true

        let ind = this.zIndexIdArray.indexOf(id);
        this.zIndexIdArray.splice(ind, 1);
        this.zIndexIdArray.push(id);
        for (let i = 0; i < this.zIndexIdArray.length; i++) {
            this.windowInfoMap[this.zIndexIdArray[i]].zindex = i + 10
        }
        return this.zIndexIdArray.length
    }
    hideWindow(id: string) {
        this.windowInfoMap[id].ifShow = false
    }
    showWindow(id: string) {
        this.windowInfoMap[id].ifShow = true
    }
    destoryWindow(id: string) {

        this.windowInfoMap[id].ifDestory = true
        this.windowInfoMap[id].windowEventMap['destroy']?.()
        this.unRegisterWindow(id);

    }
    maxWindow(id: string) {
        if (this.windowInfoMap[id]) {
            this.windowInfoMap[id].isMaximize = !this.windowInfoMap[id]?.isMaximize
        }

    }
    on(ev: string, func: Function) {
        this.eventMap[ev] = func
    }
    emit(ev: string, ...args: any) {
        this.eventMap[ev]?.(...args)
    }

}
export {
    DWM,
    WindowInfo
}