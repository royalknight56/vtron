/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 16:20:38
 * @Description: 控制窗口信息
 */
import type { windowInfoMapInter, eventMapInter, WindowInfo } from "@libs/DWM/type";
import { option } from "@/packages/window/libs/DragWindow/type";
import { UnwrapNestedRefs } from "@vue/reactivity";

import { reactive } from "vue";
import { windowInfoMap } from "@state/index"
import { System } from '@libs/System'
class PrivateDWM {//私有化管理中心，不对外暴露接口
    private static instance: PrivateDWM;
    system: System;
    private winnum: number;
    private zIndexIdArray: string[];
    private eventMap: eventMapInter;
    constructor(system: System) {
        this.system = system
        this.winnum = 0;
        this.zIndexIdArray = [];
        this.eventMap = {}
    }
    getWindow(id: string): WindowInfo {
        console.log(this.system)
        return this.system.State.windowInfoMap[id]
    }
    getWinid(): string {
        return "dragwinelementhash89103" + this.winnum
    }
    registerWindow(id: string,
        option: Required<option>
    ): WindowInfo {
        // 注册窗口，填入到windowInfoMap中
        if (this.system.State.windowInfoMap[id]) {
            return this.system.State.windowInfoMap[id]
        } else {
            this.system.State.windowInfoMap[id] = reactive({
                id,
                wid: this.winnum,
                zindex: 0,
                ifShow: true,
                iftop: false,
                ifDestory: false,
                isMaximize: false,

                ...option,

                windowEventMap: {}
            });

            this.zIndexIdArray.push(id) // 层级数组中压入id
            this.winnum++;
            return this.system.State.windowInfoMap[id]
        }
    }
    addEventListener(id: string, name: string, func: Function) {
        this.system.State.windowInfoMap[id].windowEventMap[name] = func
    }
    private unRegisterWindow(id: string) {//删除在windowInfoMap中的存储
        delete this.system.State.windowInfoMap[id]
        let ind = this.zIndexIdArray.indexOf(id)
        this.zIndexIdArray.splice(ind, 1)
    }
    upSetWindowIndex(id: string): number {
        for (let key in windowInfoMap) {
            this.system.State.windowInfoMap[key].iftop = false
        }
        this.system.State.windowInfoMap[id].iftop = true

        let ind = this.zIndexIdArray.indexOf(id);
        this.zIndexIdArray.splice(ind, 1);
        this.zIndexIdArray.push(id);
        for (let i = 0; i < this.zIndexIdArray.length; i++) {
            this.system.State.windowInfoMap[this.zIndexIdArray[i]].zindex = i + 10
        }
        return this.zIndexIdArray.length
    }
    hideWindow(id: string) {
        this.system.State.windowInfoMap[id].ifShow = false
    }
    showWindow(id: string) {
        this.system.State.windowInfoMap[id].ifShow = true
    }
    destoryWindow(id: string) {

        this.system.State.windowInfoMap[id].ifDestory = true
        this.system.State.windowInfoMap[id].windowEventMap['destroy']?.()
        this.unRegisterWindow(id);

    }
    maxWindow(id: string) {
        if (this.system.State.windowInfoMap[id]) {
            this.system.State.windowInfoMap[id].isMaximize = !this.system.State.windowInfoMap[id]?.isMaximize
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
    PrivateDWM
}