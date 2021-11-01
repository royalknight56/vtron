/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-10-29 09:56:15
 * @Description: 
 * @FilePath: /myindex/src/plug.ts
 */

import { App } from "vue";
import { appList,appconfig,appInfo,plug_option } from "./components/appconfig";
import Win from "./components/win.vue"


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


export { DragWindow } from "./components/window/libs/DragWindow";
export { WindowIPC ,PageItem } from "./components/window/libs/WindowIPC";
export { consoleIPC } from "./components/window/libs/consoleIPC";
export { computerCTC } from "./components/window/libs/computerCTC";
export { MenuIPC } from "./components/window/libs/MenuIPC";


export {
    AddToDesktop,
    ClearDesktop
}