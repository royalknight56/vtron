/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:26:31
 * @Description: 控制窗口信息
 */
import type { windowInfoMapInter, eventMapInter, WindowInfo } from "@libs/DWM/type";
import { option } from "@/packages/window/libs/DragWindow/type";

import { reactive } from "vue";

import { System } from '@libs/System';
function getWindow(system:System,id: string): WindowInfo{
    return system.State.windowInfoMap[id]
}
function getWinid(system:System): string {
    return "dragwinelementhash89103" + system.State.winnum
}

function registerWindow(system:System,id: string,
    option: Required<option>
): WindowInfo {
    // 注册窗口，填入到windowInfoMap中
    if (system.State.windowInfoMap[id]) {
        return system.State.windowInfoMap[id]
    } else {
        system.State.windowInfoMap[id] = reactive({
            id,
            wid: system.State.winnum,
            zindex: 0,
            ifShow: true,
            iftop: false,
            ifDestory: false,
            isMaximize: false,

            ...option,

            windowEventMap: {}
        });

        system.State.zIndexIdArray.push(id) // 层级数组中压入id
        system.State.winnum++;
        return system.State.windowInfoMap[id]
    }
    
}
function addEventListener(system:System,id: string, name: string, func: Function) {
    system.State.windowInfoMap[id].windowEventMap[name] = func
}
function unRegisterWindow(system:System,id: string) {//删除在windowInfoMap中的存储
    delete system.State.windowInfoMap[id]
    let ind = system.State.zIndexIdArray.indexOf(id)
    system.State.zIndexIdArray.splice(ind, 1)
}
function upSetWindowIndex(system:System,id: string): number {
    for (let key in system.State.windowInfoMap) {
        system.State.windowInfoMap[key].iftop = false
    }
    system.State.windowInfoMap[id].iftop = true

    let ind = system.State.zIndexIdArray.indexOf(id);
    system.State.zIndexIdArray.splice(ind, 1);
    system.State.zIndexIdArray.push(id);
    for (let i = 0; i < system.State.zIndexIdArray.length; i++) {
        system.State.windowInfoMap[system.State.zIndexIdArray[i]].zindex = i + 10
    }
    return system.State.zIndexIdArray.length
}
function hideWindow(system:System,id: string) {
    system.State.windowInfoMap[id].ifShow = false
}
function showWindow(system:System,id: string) {
    system.State.windowInfoMap[id].ifShow = true
}
function destoryWindow(system:System,id: string) {

    system.State.windowInfoMap[id].ifDestory = true
    system.State.windowInfoMap[id].windowEventMap['destroy']?.()
    unRegisterWindow(system,id);

}
function maxWindow(system:System,id: string) {
    if (system.State.windowInfoMap[id]) {
        system.State.windowInfoMap[id].isMaximize = !system.State.windowInfoMap[id]?.isMaximize
    }
}
function on(system:System,ev: string, func: Function) {
    system.State.eventMap[ev] = func
}
function emit(system:System,ev: string, ...args: any) {
    system.State.eventMap[ev]?.(...args)
}
export {
    getWindow,
    getWinid,
    registerWindow,
    addEventListener,
    unRegisterWindow,
    upSetWindowIndex,
    hideWindow,
    showWindow,
    destoryWindow,
    maxWindow,
    on,
    emit
}