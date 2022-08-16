/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 18:43:53
 * @Description: 
 * @FilePath: /myindex/src/plug.ts
 */

import { App } from "vue";
import { appconfig,initConfig,plug_option } from "./packages/appconfig";
// import {appList} from "@state/index"
import Win from "./packages/Win.vue"
import { Plugin } from 'vue'
import type {Notify,appInfo} from "@state/type"

let plug:Plugin = {
    install:function(app:App, opt: plug_option):void {
        // TODO: 不在此处初始化配置
        initConfig(opt)
        app.component('Win10',Win)
    },
    
}
export default plug;


export { DragWindow } from "./packages/window/libs/DragWindow";
export { DWM } from "./packages/window/libs/DWM/index";
export type { WindowInfo } from "./packages/window/libs/DWM/index";

export { Power } from "./packages/window/libs/Power";
export { ContextMenu } from "./packages/window/libs/ContextMenu";
export { Notify } from "./packages/window/libs/Notify";
export { System } from "./packages/window/libs/System";




export {
    // AddToDesktop,
    // ClearDesktop
}