import { reactive, ref, shallowReactive } from "vue";
import { UnwrapNestedRefs } from "@vue/reactivity";
import type { windowInfoMapInter } from "@libs/DWM/type";
import type { Notify, appInfo } from "@state/type"
/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 15:39:13
 * @Description: 全局的状态
 */
function stateInit() {
  let appList: UnwrapNestedRefs<Array<Required<appInfo>>> = shallowReactive([])
  let windowInfoMap: UnwrapNestedRefs<windowInfoMapInter> = reactive({})// 所有窗口信息
  let NotificationMap: UnwrapNestedRefs<{ [key: string]: Notify }> = reactive({})//提示信息
  let sysInfo = reactive({
    connection: 0,
    isCharging: false,
    chargeLevel: 0,
  })//系统信息
}
let appList: UnwrapNestedRefs<Array<Required<appInfo>>> = shallowReactive([])
let windowInfoMap: UnwrapNestedRefs<windowInfoMapInter> = reactive({})// 所有窗口信息
let NotificationMap: UnwrapNestedRefs<{ [key: string]: Notify }> = reactive({})//提示信息
let sysInfo = reactive({
  connection: 0,
  isCharging: false,
  chargeLevel: 0,
})//系统信息
export {
  appList,
  windowInfoMap,
  NotificationMap,
  sysInfo,
  stateInit
}
