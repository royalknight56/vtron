/*
 * @Author: Royal
 * @LastEditTime: 2022-07-15 11:08:34
 * @Description: 
 * @FilePath: /myindex/src/components/appconfig.ts
 */
import { reactive, shallowReactive } from "vue";
import {System} from '@libs/System'

// 系统设置
type loginOption = {
    user_name:string,
    user_password?:string,
}
const defaultOption = {
    start_time:2000,
    if_logo_show:true,
    start_menu_logo:'default',
    backimg:'default',
    login:<loginOption|null>null
}
type OptionType = typeof defaultOption
type partialOption=Partial<typeof defaultOption>

class SystemConfig{
    config:typeof defaultOption;
    system:System;
    constructor(system:System){
        this.config = reactive({...defaultOption})
        this.system = system
    }
    initConfig(params:partialOption) {
        Object.assign(this.config,params)
    }
    setConfig<K extends keyof (typeof defaultOption)>(key:K,params:(typeof defaultOption)[K])  {
        this.config[key]=params
    }
    // storeConfig() {  
    //     let temp: partialOption = JSON.parse(JSON.stringify( this.config));
    //     temp.login=undefined; //去除login的存储
    //     localStorage.setItem('appconfig',JSON.stringify(temp))
    // }
    // clearStoreConfig() {
    //     localStorage.clear()
    // }
}
export {
    OptionType,
    partialOption,
    SystemConfig,
}