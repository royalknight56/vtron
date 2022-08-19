import type { windowInfoMapInter, eventMapInter, WindowInfo } from "@libs/DWM/type";
import { option } from "@/packages/window/libs/DragWindow/type";

import { reactive } from "vue";

import { System } from '@libs/System';
import { DragWindow } from "@libs/DragWindow";
function getWindow(system:System,id: string): DragWindow{
  return system.State.windowInfoMap[id]
}
function getWinid(system:System): string {
  return "dragwinelementhash89103" + system.State.winnum
}
export {
  getWindow,
  getWinid
}