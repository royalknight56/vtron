/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:35:35
 * @Description: 新建窗口类
 * @FilePath: /myindex/src/components/window/libs/DragWindow.ts
 * Need CodeReview 
 */
import { defineComponent, nextTick } from "vue";
import { WindowInfo } from "@/packages/window/libs/DWM/index"
import {EvMap,EvMapFunction,option,OptionAll,OptionSFC,OptionNoSFC,} from "./type";
import { System } from '@libs/System'
import { defaultOption } from '@libs/option'

import * as  WinManagement from '@libs/DWM/WinManagement';
class DragWindow {
    evMap: EvMapFunction
    windowInfo: WindowInfo | null

    private option: Required<option>
    id: string
    private system: System
    private isCreated: boolean

    constructor(option: option,system:System) {
        this.system = system
        this.windowInfo = null;

        this.evMap = {};
        this.option = Object.assign({
            x: 0,
            y: 0,
            width: 400,
            height: 400,
            props: {},
            icon: defaultOption.icon,
            isScalable: true,
            isSFC: false,
            buttons:['close','min','max'],
            title:defaultOption.untitle
        }, option)
        this.id = WinManagement.getWinid(this.system);
        this.isCreated = false;
    }
    private getWinInner() {
        let dom = document.getElementById(this.system.id);
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
    addWindowEventListener(event: 'onDraging', callback: (x: number, y: number, ifdrag: boolean)=>void) : void;
    addWindowEventListener(event: 'onResizing', callback: (x: number, y: number)=>void) : void;

    addWindowEventListener(event:keyof EvMap, callback:any) : any {
        this.evMap[event] = callback;
    }
    private register(option: Required<option>) {
        this.windowInfo = WinManagement.registerWindow(this.system,this.id, option);//在IPC中注册，传递windowInfo
    }
    private makeWindowNotOverSize() {// 使窗口不超过屏幕大小
        if (this.windowInfo) {
            if (this.windowInfo.isScalable) {//只有可缩放窗口
                let { x, y, width, height } = this.windowInfo;
                let { width: winWidth, height: winHeight } = this.getWinInner();//获取窗口大小
                if (x + width > winWidth) {
                    this.windowInfo.width = winWidth - x;
                }
                if (y + height > winHeight) {
                    this.windowInfo.height = winHeight - y;
                }
            }
        }
    }
    private afterRegister(){// 注册之后的操作
        this.makeWindowNotOverSize();// 使得窗口在生成时，不超过屏幕
        
        nextTick(() => {
            WinManagement.upSetWindowIndex(this.system,this.id)//新窗口在顶部
            this.isCreated = true;
        })
    }

    show(option?: Partial<option>) {// 调用show之后，注册窗口，展示窗口
        if (!this.isCreated && !this.windowInfo?.ifDestory) {// 如果没有被创建，并且没被销毁
            this.id=WinManagement.getWinid(this.system);//在窗口是第一次注册时，获取一个唯一id
        }
        this.register(Object.assign(this.option, option))//注册
        this.afterRegister()//注册之后
    }
}

function DragWindowFactory(system:System){
    return (option:option) => {
        return new DragWindow(option,system)
    }
    
}
export {
    DragWindow,
    DragWindowFactory
}