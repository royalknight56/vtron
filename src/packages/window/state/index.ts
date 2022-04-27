import { reactive, ref } from "vue";
import { UnwrapNestedRefs } from "@vue/reactivity";
import type {windowInfoMapInter} from "@libs/DWM/type";
/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-04-27 16:12:16
 * @Description: 全局的状态
 */
interface Notify {
  title: string,
  messages: string,
  isHidden: boolean
}
export default reactive({
  windowInfoMap:{} as UnwrapNestedRefs<windowInfoMapInter>,// 所有窗口信息
  NotificationMap: {} as UnwrapNestedRefs<{ [key: string]: Notify }> //提示信息
});