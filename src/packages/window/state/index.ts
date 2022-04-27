import { reactive, ref } from "vue";
import { UnwrapNestedRefs } from "@vue/reactivity";

/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-04-27 10:58:38
 * @Description: 全局的状态
 */
interface Notify {
  title: string,
  messages: string,
  isHidden: boolean
}
export default reactive({
  NotificationMap: {} as UnwrapNestedRefs<{ [key: string]: Notify }>
});