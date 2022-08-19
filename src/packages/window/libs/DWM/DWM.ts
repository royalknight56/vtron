/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 16:22:23
 * @Description: 
 */

import * as  WinManagement from '@libs/DWM/WindowManage';

import type { windowInfoMapInter,eventMapInter,WindowInfo } from "@libs/DWM/type";
import {System} from '@libs/System'
class DWM{
    private system:System;
    constructor(system:System) {
        this.system = system
    }
    getWindow(id: string): WindowInfo {
        return WinManagement.getWindow(this.system,id)
    }
    addEventListener(id: string, name: string, func: Function) {
        return WinManagement.addEventListener(this.system,id,name,func)
    }
    upSetWindowIndex(id: string){
        return WinManagement.upSetWindowIndex(this.system,id)
    }
    hideWindow(id: string) {
        return WinManagement.hideWindow(this.system,id)
    }
    showWindow(id: string) {
        return WinManagement.showWindow(this.system,id)
    }
    destroyWindow(id: string) {
        return WinManagement.destroyWindow(this.system,id)
    }
    maxWindow(id: string) {
        return WinManagement.maxWindow(this.system,id)
    }
    on(ev: string, func: Function) {
        return WinManagement.on(this.system,ev,func)
    }
    emit(ev: string, ...args: any) {
        return WinManagement.emit(this.system,ev,...args)
    }

}
export {
    DWM
}