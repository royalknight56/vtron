import { reactive, ref,shallowReactive } from "vue";
import { UnwrapNestedRefs } from "@vue/reactivity";
import type {windowInfoMapInter} from "@libs/DWM/type";
import type {Notify,appInfo} from "@state/type"
/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-04-28 11:19:01
 * @Description: 全局的状态
 */

export default reactive({
  appList:shallowReactive([]) as UnwrapNestedRefs<Array<Required<appInfo>>>,
  windowInfoMap:{} as UnwrapNestedRefs<windowInfoMapInter>,// 所有窗口信息
  NotificationMap: {} as UnwrapNestedRefs<{ [key: string]: Notify }> //提示信息
});