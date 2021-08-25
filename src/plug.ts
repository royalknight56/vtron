/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-25 15:05:11
 * @Description: 
 * @FilePath: /myindex/src/plug.ts
 */

import { App } from "vue";
import { appList,appconfig,appInfo,plug_option } from "./components/appconfig";
import Win from "./components/win.vue"


let plug = {
    version:'0.1.0',
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


export { DragWindow } from "./components/window/libs/DragWindow";
export { WindowIPC ,PageItem } from "./components/window/libs/WindowIPC";
export { consoleIPC } from "./components/window/libs/consoleIPC";
export { computerCTC } from "./components/window/libs/computerCTC";
export { MenuIPC } from "./components/window/libs/MenuIPC";


export {
    AddToDesktop,
    ClearDesktop
}