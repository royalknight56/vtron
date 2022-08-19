import { reactive, ref, shallowReactive } from "vue";
import { UnwrapNestedRefs } from "@vue/reactivity";
import type { windowInfoMapInter,eventMapInter, DragWindowMapInter } from "@libs/DWM/type";
import type { Notify, appInfo } from "@state/type"

/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 18:29:36
 * @Description: 全局的状态
 */
function stateInit() {
  let appList: Array<Required<appInfo>> = shallowReactive([])
  let windowInfoMap: DragWindowMapInter = reactive({})// 所有窗口信息
  let NotificationMap: UnwrapNestedRefs<{ [key: string]: Notify }> = reactive({})//提示信息
  let sysInfo = reactive({
    connection: 0,
    isCharging: false,
    chargeLevel: 0,
  })//系统信息
  let zIndexIdArray:string[]=[];// 窗口层叠信息
  let eventMap: eventMapInter={};// 事件
  let winnum:number = 0;// 窗口数量
  return {
    appList,
    windowInfoMap,
    NotificationMap,
    sysInfo,
    zIndexIdArray,
    eventMap,
    winnum
  }
}

type State = ReturnType<typeof stateInit>

export {
  State,
  stateInit
}
