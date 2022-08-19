/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:35:35
 * @Description: 新建窗口类
 * @FilePath: /myindex/src/components/window/libs/DragWindow.ts
 * Need CodeReview 
 */
import { defineComponent, nextTick, reactive } from "vue";
import { WindowInfo } from "@/packages/window/libs/DWM/index"
import {EvMap,EvMapFunction,option,OptionAll,OptionSFC,OptionNoSFC,} from "./type";
import { System } from '@libs/System'
import { defaultOption } from '@libs/option'

// import * as  WinManagement from '@libs/DWM/WinManagement';
import * as  WinManagement from '@libs/DWM/WindowManage';

class DragWindow {
    evMap: EvMapFunction
    readonly windowInfo: WindowInfo

    private option: Required<option>
    id: string
    private system: System

    constructor(option: option,system:System) {
        this.system = system
        

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
        this.windowInfo =  reactive({
            id: this.id ,
            wid: system.State.winnum,
            zindex: 0,
            isVisible: true,
            istop: false,
            isMaximize: false,
            isCreate: false,
            ...this.option,
            windowEventMap: {}
        });
        this.register(this)//注册;
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
    private register(dragWindow:DragWindow) {
        WinManagement.registerWindow(this.system,this.id, dragWindow);//在IPC中注册，传递windowInfo
    }
    private showWindow() {// 显示窗口
        WinManagement.showWindow(this.system,this.id)
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
        })
    }

    show(option?: Partial<option>) {// 调用show之后，注册窗口，展示窗口
        if (option) {
            this.option = Object.assign(this.option, option)
        }
        // console.log(this)
        WinManagement.createWindow(this.system,this.id)
        // console.log(this)
        this.showWindow();// 显示窗口
        // console.log(this)
        this.afterRegister()//注册之后
    }
    hide() {// 隐藏窗口
        WinManagement.hideWindow(this.system,this.id)
    }
    destroy() {// 销毁窗口
        WinManagement.destroyWindow(this.system,this.id)
    }
    isMinimized() {// 是否最小化
        return this.windowInfo.isVisible?false:true
    }
    minimize() {// 最小化窗口
        this.windowInfo.isVisible = false;
    }
    isMaximized() {// 是否最大化
        return this.windowInfo.isMaximize
    }
    maximize() {// 最大化窗口
        this.windowInfo.isMaximize = true;
    }
    moveTop(){
        WinManagement.upSetWindowIndex(this.system,this.id)
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