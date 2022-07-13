/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-07-13 09:59:03
 * @Description: 
 */
import { option,OptionAll,OptionNoSFC,OptionSFC } from "@/packages/window/libs/DragWindow/type";
interface BuiltinPorps {
  //内建属性
  id: string,
  wid: number,
  zindex: number,
  ifShow: boolean,
  iftop: boolean,
  ifDestory: boolean,
  isMaximize: boolean,

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
export interface windowInfoMapInter {
  [index: string]: WindowInfo
}
export interface eventMapInter {
  [index: string]: Function
}
