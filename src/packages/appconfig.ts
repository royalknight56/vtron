/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-03-07 16:28:29
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
let localConfigString = localStorage.getItem('appconfig');
let localConfig:Partial<typeof appconfig>={};
let isLocalConfig= false;
if(localConfigString){
    localConfig = JSON.parse(localConfigString)
    isLocalConfig = true
}

let appconfig={
    start_time:2000,
    if_logo_show:true,
    start_menu_logo:'default',
    backimg:'default',
    login:<loginOption|null>null
}
Object.assign(appconfig,localConfig)
function setConfig(params:Partial<typeof appconfig>) {
    Object.assign(appconfig,params)
    if(isLocalConfig){
        Object.assign(appconfig,localConfig)
    }
}
type plug_option=Partial<typeof appconfig>
export {appList,appconfig,
    setConfig,
    appInfo,plug_option}