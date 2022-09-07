/*
 * @Author: Royal
 * @LastEditTime: 2022-07-13 09:58:55
 * @Description: 
 */
import { DefineComponent } from 'vue';
import { DragWindow } from "@libs/DragWindow";
type WindowButton = 'flush' | 'close' | 'min' | 'max'
interface baseOption {
    props?: any,
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    title?: string,
    icon?: string,
    isScalable?: boolean,
    frame?: boolean,// 是否显示边框
    buttons?: WindowButton[],    // 右上角按钮
    content: DefineComponent<{}, {}, any> | string,
}

type OptionAll = baseOption;


interface BuiltinPorps {
    //内建属性
    id: string,
    wid: number,
    zindex: number,
    isVisible: boolean,
    istop: boolean,
    isMaximize: boolean,
    isCreate: boolean,
    callData: {
        callFrom: string,
    },
    windowEventMap: {
        [index: string]: Function
    },
}
interface WindowInfoTemp extends BuiltinPorps, OptionAll {
}

type WindowInfo = Required<WindowInfoTemp>

interface EvMap {
    onDraging: { x: number, y: number, ifdrag: boolean }
    onResizing: { x: number, y: number }
}
type EvMapFunction = {
    [K in keyof EvMap]?: (ev: EvMap[K]) => void
};


export {
    WindowInfoTemp,
    WindowInfo,
    OptionAll,
    EvMap,
    EvMapFunction
}

export interface DragWindowMapInter {
    [index: string]: DragWindow
}
export interface windowInfoMapInter {
    [index: string]: WindowInfo
}
export interface eventMapInter {
    [index: string]: Function
}
