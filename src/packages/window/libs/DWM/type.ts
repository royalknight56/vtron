/*
 * @Author: Royal
 * @LastEditTime: 2022-07-13 09:59:03
 * @Description: 
 */
import { option,OptionAll,OptionNoSFC,OptionSFC } from "@/packages/window/libs/DragWindow/type";
import { DragWindow } from "@libs/DragWindow";
interface BuiltinPorps {
  //内建属性
  id: string,
  wid: number,
  zindex: number,
  isVisible: boolean,
  istop: boolean,
  isMaximize: boolean,
  isCreate: boolean,
  windowEventMap: {
      [index: string]: Function
  },
}
interface NoSFCWindowInfo extends BuiltinPorps,OptionNoSFC {
}
interface SFCWindowInfo extends BuiltinPorps,OptionSFC {
}
type WindowInfo = Required<NoSFCWindowInfo|SFCWindowInfo>
export  {
  WindowInfo
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
