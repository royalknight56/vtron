/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-03-17 19:28:32
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
class PrivateDWM {//私有化管理中心，不对外暴露接口
    private static instance: PrivateDWM;
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
            this.instance = new PrivateDWM()
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
                buttons: option.buttons,

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
    scaleChange(id:string,width?:number,height?:number){
        this.windowInfoMap[id].width=width||this.windowInfoMap[id].width;
        this.windowInfoMap[id].height=height||this.windowInfoMap[id].height;
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


class DWM{
    private static instance: DWM;
    private constructor() {

    }
    static getInstance() {
        if (this.instance == undefined) {
            this.instance = new DWM()
        }
        return this.instance
    }
    getWindow(id: string): WindowInfo {
        return PrivateDWM.getInstance().getWindow(id)
    }
    addEventListener(id: string, name: string, func: Function) {
        return PrivateDWM.getInstance().addEventListener(id,name,func)
    }
    upSetWindowIndex(id: string){
        return PrivateDWM.getInstance().upSetWindowIndex(id)
    }
    hideWindow(id: string) {
        return PrivateDWM.getInstance().hideWindow(id)
    }
    showWindow(id: string) {
        return PrivateDWM.getInstance().showWindow(id)
    }
    destoryWindow(id: string) {
        return PrivateDWM.getInstance().destoryWindow(id)
    }
    maxWindow(id: string) {
        return PrivateDWM.getInstance().maxWindow(id)
    }
    on(ev: string, func: Function) {
        return PrivateDWM.getInstance().on(ev,func)
    }
    emit(ev: string, ...args: any) {
        return PrivateDWM.getInstance().emit(ev,...args)
    }

}
export {
    DWM,
    PrivateDWM,
    WindowInfo
}