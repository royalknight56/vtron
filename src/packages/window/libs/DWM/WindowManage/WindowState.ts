import type { windowInfoMapInter, eventMapInter, WindowInfo } from "@libs/DWM/type";
import { option } from "@/packages/window/libs/DragWindow/type";

import { reactive } from "vue";

import { System } from '@libs/System';

function upSetWindowIndex(system:System,id: string): number {
  for (let key in system.State.windowInfoMap) {
      system.State.windowInfoMap[key].windowInfo.istop = false
  }
  system.State.windowInfoMap[id].windowInfo.istop = true

  let ind = system.State.zIndexIdArray.indexOf(id);
  system.State.zIndexIdArray.splice(ind, 1);
  system.State.zIndexIdArray.push(id);
  for (let i = 0; i < system.State.zIndexIdArray.length; i++) {
      system.State.windowInfoMap[system.State.zIndexIdArray[i]].windowInfo.zindex = i + 10
  }
  return system.State.zIndexIdArray.length
}
function hideWindow(system:System,id: string) {
  system.State.windowInfoMap[id].windowInfo.isVisible = false
}
function showWindow(system:System,id: string) {
  system.State.windowInfoMap[id].windowInfo.isVisible = true
}
function createWindow(system:System,id: string) {
  system.State.windowInfoMap[id].windowInfo.isCreate = true
}
function destroyWindow(system:System,id: string) {

  system.State.windowInfoMap[id].windowInfo.isCreate = false
  system.State.windowInfoMap[id].windowInfo.windowEventMap['destroy']?.()

}
function maxWindow(system:System,id: string) {
  system.State.windowInfoMap[id].windowInfo.isMaximize = !system.State.windowInfoMap[id]?.windowInfo.isMaximize
}
function on(system:System,ev: string, func: Function) {
  system.State.eventMap[ev] = func
}
function emit(system:System,ev: string, ...args: any) {
  system.State.eventMap[ev]?.(...args)
}
export {
  upSetWindowIndex,
  hideWindow,
  showWindow,
  createWindow,
  destroyWindow,
  maxWindow,
  on,
  emit
}