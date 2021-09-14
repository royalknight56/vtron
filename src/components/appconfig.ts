/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-09-14 16:41:06
 * @Description: 
 * @FilePath: /myindex/src/components/appconfig.ts
 */
import { defineComponent, shallowReactive } from "vue";
interface appInfo{
    name: string,
    icon:string,
    width:number,
    height:number,
    tmp:ReturnType<typeof defineComponent>,
    use?:Array<any>
}

import { UnwrapNestedRefs } from "@vue/reactivity";


let appList:UnwrapNestedRefs<Array<appInfo>> = shallowReactive([

])

// interface plug_option_finnal{
//     start_time:number,
//     if_logo_show:boolean
// }
type to_opt_map<T>={
    [P in keyof T]?:T[P];
}

interface plug_option_finnal{
    start_time:number,
    if_logo_show:boolean
}
type plug_option=to_opt_map<plug_option_finnal>

let appconfig:plug_option_finnal={
    start_time:2000,
    if_logo_show:true
}
export {appList,appconfig,appInfo,plug_option,plug_option_finnal}