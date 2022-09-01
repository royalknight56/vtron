/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:35:35
 * @Description: 新建窗口类
 * @FilePath: /myindex/src/components/window/libs/DragWindow.ts
 * Need CodeReview 
 */
import { defineComponent, nextTick, reactive } from "vue";
import { WindowInfo } from "@libs/DragWindow/type";
import { EvMap, EvMapFunction, OptionAll, } from "./type";
import { System } from '@libs/System'
import { defaultOption } from '@libs/option'
// import * as  WinManagement from '@libs/DWM/WindowManage';

class DragWindow {
    evMap: EvMapFunction
    readonly windowInfo: WindowInfo

    private option: Required<OptionAll>
    id: string
    private system: System

    constructor(option: OptionAll, system: System) {
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
            buttons: ['close', 'min', 'max'],
            title: defaultOption.untitle
        }, option)
        this.id = system.id + system.State.winnum;
        this.windowInfo = reactive({
            id: this.id,
            wid: system.State.winnum,
            zindex: 0,
            isVisible: true,
            istop: false,
            isMaximize: false,
            isCreate: false,
            ...this.option,
            windowEventMap: {}
        });

        system.State.windowInfoMap[this.id] = this;
        system.State.zIndexIdArray.push(this.id) // 层级数组中压入id
        system.State.winnum++;
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
    addWindowEventListener(event: 'onDraging', callback: (x: number, y: number, ifdrag: boolean) => void): void;
    addWindowEventListener(event: 'onResizing', callback: (x: number, y: number) => void): void;

    addWindowEventListener(event: keyof EvMap, callback: any): any {
        this.evMap[event] = callback;
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
    private afterRegister() {// 注册之后的操作
        this.makeWindowNotOverSize();// 使得窗口在生成时，不超过屏幕
        nextTick(() => {
            this.moveTop()//新窗口在顶部
        })
    }

    show(option?: Partial<OptionAll>) {// 调用show之后，注册窗口，展示窗口
        if (option) {
            this.option = Object.assign(this.option, option)
        }
        this.windowInfo.isCreate = true
        this.windowInfo.isVisible = true// 显示窗口
        this.afterRegister()//注册之后
    }
    hide() {// 隐藏窗口
        this.windowInfo.isVisible = false
    }
    destroy() {// 销毁窗口
        this.windowInfo.isCreate = false
        this.windowInfo.windowEventMap['destroy']?.()
    }
    isMinimized() {// 是否最小化
        return this.windowInfo.isVisible ? false : true
    }
    minimize() {// 最小化窗口
        this.windowInfo.isVisible = false;
    }
    restore() {// 恢复窗口
        this.windowInfo.isVisible = true;
    }
    isMaximized() {// 是否最大化
        return this.windowInfo.isMaximize
    }
    maximize() {// 最大化窗口
        this.windowInfo.isMaximize = true;
    }
    unmaximize() {// 取消最大化窗口
        this.windowInfo.isMaximize = false;
    }
    moveTop() {
        for (let key in this.system.State.windowInfoMap) {
            this.system.State.windowInfoMap[key].windowInfo.istop = false
        }
        this.windowInfo.istop = true

        let ind = this.system.State.zIndexIdArray.indexOf(this.id);
        this.system.State.zIndexIdArray.splice(ind, 1);
        this.system.State.zIndexIdArray.push(this.id);
        for (let i = 0; i < this.system.State.zIndexIdArray.length; i++) {
            this.system.State.windowInfoMap[this.system.State.zIndexIdArray[i]].windowInfo.zindex = i + 10
        }
        return this.system.State.zIndexIdArray.length
    }
    isNormal() {
        return !this.isMaximized() && !this.isMinimized()
    }
    setSize(width: number, height: number) {// 设置窗口大小
        this.windowInfo.width = width;
        this.windowInfo.height = height;
        this.makeWindowNotOverSize();
    }
    getSize() {// 获取窗口大小
        return {
            width: this.windowInfo.width,
            height: this.windowInfo.height
        }
    }
    setPosition(x: number, y: number) {// 设置窗口位置
        this.windowInfo.x = x;
        this.windowInfo.y = y;
    }
    getPosition() {// 获取窗口位置
        return {
            x: this.windowInfo.x,
            y: this.windowInfo.y
        }
    }
    center() {
        this.setPosition((this.system.State.sysInfo.width - this.windowInfo.width) / 2, (this.system.State.sysInfo.height - this.windowInfo.height) / 2)
    }
}

function DragWindowFactory(system: System) {
    return (option:OptionAll) => {
        return new DragWindow(option, system)
    }

}
export {
    DragWindow,
    DragWindowFactory
}