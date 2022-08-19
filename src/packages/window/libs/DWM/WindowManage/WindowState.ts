import type { windowInfoMapInter, eventMapInter, WindowInfo } from "@libs/DWM/type";
import { option } from "@/packages/window/libs/DragWindow/type";

import { reactive } from "vue";

import { System } from '@libs/System';

function addEventListener(system:System,id: string, name: string, func: Function) {
  system.State.windowInfoMap[id].windowEventMap[name] = func
}

function upSetWindowIndex(system:System,id: string): number {
  for (let key in system.State.windowInfoMap) {
      system.State.windowInfoMap[key].istop = false
  }
  system.State.windowInfoMap[id].istop = true

  let ind = system.State.zIndexIdArray.indexOf(id);
  system.State.zIndexIdArray.splice(ind, 1);
  system.State.zIndexIdArray.push(id);
  for (let i = 0; i < system.State.zIndexIdArray.length; i++) {
      system.State.windowInfoMap[system.State.zIndexIdArray[i]].zindex = i + 10
  }
  return system.State.zIndexIdArray.length
}
function hideWindow(system:System,id: string) {
  system.State.windowInfoMap[id].isVisible = false
}
function showWindow(system:System,id: string) {
  system.State.windowInfoMap[id].isVisible = true
}
function createWindow(system:System,id: string) {
  system.State.windowInfoMap[id].isCreate = true
}
function destroyWindow(system:System,id: string) {

  system.State.windowInfoMap[id].isCreate = false
  system.State.windowInfoMap[id].windowEventMap['destroy']?.()

}
function maxWindow(system:System,id: string) {
  system.State.windowInfoMap[id].isMaximize = !system.State.windowInfoMap[id]?.isMaximize
}
function on(system:System,ev: string, func: Function) {
  system.State.eventMap[ev] = func
}
function emit(system:System,ev: string, ...args: any) {
  system.State.eventMap[ev]?.(...args)
}
export {
  addEventListener,
  upSetWindowIndex,
  hideWindow,
  showWindow,
  createWindow,
  destroyWindow,
  maxWindow,
  on,
  emit
}