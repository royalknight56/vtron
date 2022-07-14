/*
 * @Author: Royal
 * @LastEditTime: 2022-04-27 16:08:49
 * @Description: 
 */

import { PrivateDWM} from '@libs/DWM/PrivateDWM';
import type { windowInfoMapInter,eventMapInter,WindowInfo } from "@libs/DWM/type";

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
}