/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-01-20 18:31:16
 * @Description: 
 * @FilePath: /myindex/src/components/appconfig.ts
 */
import { shallowReactive } from "vue";
import { UnwrapNestedRefs } from "@vue/reactivity";
import { DragWindow } from "./window/libs/DragWindow";
interface appInfo{
    name?: string,
    icon?:string,
    window:DragWindow,
}

let appList:UnwrapNestedRefs<Array<Required<appInfo>>> = shallowReactive([

])
type loginOption = {
    user_name:string,
    user_password?:string,
}

let appconfig={
    start_time:2000,
    if_logo_show:true,
    start_menu_logo:'default',
    backimg:'default',
    login:<loginOption|null>null
}
type plug_option=Partial<typeof appconfig>
export {appList,appconfig,appInfo,plug_option}