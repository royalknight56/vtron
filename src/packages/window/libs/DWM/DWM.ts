/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 16:22:23
 * @Description: 
 */

import * as  WinManagement from '@libs/DWM/WindowManage';

import type { windowInfoMapInter,eventMapInter,WindowInfo } from "@libs/DWM/type";
import { DragWindow } from "@libs/DragWindow";
import {System} from '@libs/System'
class DWM{
    private system:System;
    constructor(system:System) {
        this.system = system
    }
    getWindow(id: string): DragWindow {
        return WinManagement.getWindow(this.system,id)
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