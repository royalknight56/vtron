/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-04-27 15:39:39
 * @Description: 
 */
import { option } from "@libs/DragWindow";
export interface WindowInfo extends Required<option> {
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

export interface windowInfoMapInter {
  [index: string]: WindowInfo
}
export interface eventMapInter {
  [index: string]: Function
}
