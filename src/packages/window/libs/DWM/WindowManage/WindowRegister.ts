import type { windowInfoMapInter, eventMapInter, WindowInfo } from "@libs/DWM/type";
import { option } from "@/packages/window/libs/DragWindow/type";

import { reactive } from "vue";

import { System } from '@libs/System';
import { DragWindow } from "@libs/DragWindow";
function registerWindow(system:System,id: string,
  dragWindow:DragWindow
) {
  // 注册窗口，填入到windowInfoMap中
  // if (system.State.windowInfoMap[id]) {
  //     return system.State.windowInfoMap[id]
  // } else {
      system.State.windowInfoMap[id] = dragWindow;
      system.State.zIndexIdArray.push(id) // 层级数组中压入id
      system.State.winnum++;
  // }
}
function unRegisterWindow(system:System,id: string) {//删除在windowInfoMap中的存储
  delete system.State.windowInfoMap[id]
  let ind = system.State.zIndexIdArray.indexOf(id)
  system.State.zIndexIdArray.splice(ind, 1)
}
export {
  registerWindow,
  unRegisterWindow
}