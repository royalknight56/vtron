/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-12-28 14:43:22
 * @Description: 
 * @FilePath: /myindex/src/components/appconfig.ts
 */
import { shallowReactive } from "vue";
import { UnwrapNestedRefs } from "@vue/reactivity";
import { DragWindow } from "./window/libs/DragWindow";
interface appInfo{
    name: string,
    icon:string,
    window:DragWindow,
}

let appList:UnwrapNestedRefs<Array<appInfo>> = shallowReactive([

])

let appconfig={
    start_time:2000,
    if_logo_show:true,
    start_menu_logo:'default',
    backimg:'default',
    user_name:'Admin',
    user_password:'123456',

}
type plug_option=Partial<typeof appconfig>
export {appList,appconfig,appInfo,plug_option}