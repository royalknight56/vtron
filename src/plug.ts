/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-12-16 19:11:40
 * @Description: 
 * @FilePath: /myindex/src/plug.ts
 */

import { App } from "vue";
import { appList,appconfig,appInfo,plug_option } from "./packages/appconfig";
import Win from "./packages/Win.vue"


let plug = {
    version:'0.1.1',
    install:function(app:App<any>, opt: plug_option):void {
        Object.assign(appconfig,opt)
        app.component('Win10',Win)
    },
    
}
export default plug

function AddToDesktop(app:appInfo) {
    appList.push(app)
}
function ClearDesktop() {
    appList.splice(0,appList.length)
}


export { DragWindow } from "./packages/window/libs/DragWindow";
export { WindowIPC } from "./packages/window/libs/WindowIPC";
export type { WindowInfo } from "./packages/window/libs/WindowIPC";


// export { consoleIPC } from "./packages/window/libs/consoleIPC";
export { computerCTC } from "./packages/window/libs/systemStates";
export { MenuIPC } from "./packages/window/libs/MenuCtrl";


export {
    AddToDesktop,
    ClearDesktop
}