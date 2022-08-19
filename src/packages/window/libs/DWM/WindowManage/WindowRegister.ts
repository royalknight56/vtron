import type { windowInfoMapInter, eventMapInter, WindowInfo } from "@libs/DWM/type";
import { option } from "@/packages/window/libs/DragWindow/type";

import { reactive } from "vue";

import { System } from '@libs/System';
function registerWindow(system:System,id: string,
  option: Required<option>
): WindowInfo {
  // 注册窗口，填入到windowInfoMap中
  if (system.State.windowInfoMap[id]) {
      return system.State.windowInfoMap[id]
  } else {
      system.State.windowInfoMap[id] = reactive({
          id,
          wid: system.State.winnum,
          zindex: 0,
          isVisible: true,
          istop: false,
          isMaximize: false,
          isCreate: false,
          ...option,

          windowEventMap: {}
      });

      system.State.zIndexIdArray.push(id) // 层级数组中压入id
      system.State.winnum++;
      return system.State.windowInfoMap[id]
  }
  
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