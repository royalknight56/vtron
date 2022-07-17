/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 16:22:23
 * @Description: 
 */

import { PrivateDWM} from '@libs/DWM/PrivateDWM';
import type { windowInfoMapInter,eventMapInter,WindowInfo } from "@libs/DWM/type";
import {System} from '@libs/System'
class DWM{
    // private static instance: DWM;
    system:System;
    privateDWM :PrivateDWM
    constructor(system:System) {
        this.system = system
        this.privateDWM =new PrivateDWM(this.system)
    }
    getWindow(id: string): WindowInfo {
        return this.privateDWM.getWindow(id)
    }
    addEventListener(id: string, name: string, func: Function) {
        return this.privateDWM.addEventListener(id,name,func)
    }
    upSetWindowIndex(id: string){
        return this.privateDWM.upSetWindowIndex(id)
    }
    hideWindow(id: string) {
        return this.privateDWM.hideWindow(id)
    }
    showWindow(id: string) {
        return this.privateDWM.showWindow(id)
    }
    destoryWindow(id: string) {
        return this.privateDWM.destoryWindow(id)
    }
    maxWindow(id: string) {
        return this.privateDWM.maxWindow(id)
    }
    on(ev: string, func: Function) {
        return this.privateDWM.on(ev,func)
    }
    emit(ev: string, ...args: any) {
        return this.privateDWM.emit(ev,...args)
    }

}
export {
    DWM,
    PrivateDWM,
}