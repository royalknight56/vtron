/*
 * @Author: Royal
 * @LastEditTime: 2022-04-28 11:05:41
 * @Description: 
 */
import { DragWindow } from "@libs/DragWindow/index";
interface Notify {
  title: string,
  messages: string,
  isHidden: boolean
}

// 桌面图标配置
interface appInfo{
  name?: string,
  icon?:string,
  window:DragWindow,
}
export {
  Notify,
  appInfo
}