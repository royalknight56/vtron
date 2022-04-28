/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-04-28 19:28:57
 * @Description: 控制窗口信息
 */
import type { windowInfoMapInter,eventMapInter,WindowInfo } from "@libs/DWM/type";
import { option } from "@/packages/window/libs/DragWindow";
import {UnwrapNestedRefs} from "@vue/reactivity";

import { reactive } from "vue";
import {windowInfoMap} from "@state/index"
// let windowInfoMap = state.windowInfoMap
class PrivateDWM {//私有化管理中心，不对外暴露接口
  private static instance: PrivateDWM;
  private winnum: number;
  private zIndexIdArray: string[];
  private eventMap: eventMapInter;
  private constructor() {
      this.winnum = 0;
      this.zIndexIdArray = [];
      this.eventMap = {}
  }
  static getInstance() {
      if (this.instance == undefined) {
          this.instance = new PrivateDWM()
      }
      return this.instance
  }
  getWindow(id: string): WindowInfo {
      return windowInfoMap[id]
  }
  getWinid(): string {
      return "dragwinelementhash89103" + this.winnum
  }
  registerWindow(id: string,
      option: Required<option>
  ): WindowInfo {
      // 注册窗口，填入到windowInfoMap中
      if (windowInfoMap[id]) {
          return windowInfoMap[id]
      } else {
          windowInfoMap[id] = reactive({
              id,
              wid: this.winnum,
              zindex: 0,
              ifShow: true,
              iftop: false,
              ifDestory: false,
              isMaximize: false,
              
              ...option,

              windowEventMap: {}
          });

          this.zIndexIdArray.push(id) // 层级数组中压入id
          this.winnum++;
          console.log(windowInfoMap)
          return windowInfoMap[id]
      }
  }
  addEventListener(id: string, name: string, func: Function) {
      windowInfoMap[id].windowEventMap[name] = func
  }
  private unRegisterWindow(id: string) {//删除在windowInfoMap中的存储
      delete windowInfoMap[id]
      let ind = this.zIndexIdArray.indexOf(id)
      this.zIndexIdArray.splice(ind, 1)
  }
  upSetWindowIndex(id: string): number {
      for (let key in windowInfoMap) {
          windowInfoMap[key].iftop = false
      }
      windowInfoMap[id].iftop = true

      let ind = this.zIndexIdArray.indexOf(id);
      this.zIndexIdArray.splice(ind, 1);
      this.zIndexIdArray.push(id);
      for (let i = 0; i < this.zIndexIdArray.length; i++) {
          windowInfoMap[this.zIndexIdArray[i]].zindex = i + 10
      }
      return this.zIndexIdArray.length
  }
  hideWindow(id: string) {
      windowInfoMap[id].ifShow = false
  }
  showWindow(id: string) {
      windowInfoMap[id].ifShow = true
  }
  destoryWindow(id: string) {

      windowInfoMap[id].ifDestory = true
      windowInfoMap[id].windowEventMap['destroy']?.()
      this.unRegisterWindow(id);

  }
  maxWindow(id: string) {
      if (windowInfoMap[id]) {
          windowInfoMap[id].isMaximize = !windowInfoMap[id]?.isMaximize
      }

  }
  on(ev: string, func: Function) {
      this.eventMap[ev] = func
  }
  emit(ev: string, ...args: any) {
      this.eventMap[ev]?.(...args)
  }

}

export {
  PrivateDWM
}