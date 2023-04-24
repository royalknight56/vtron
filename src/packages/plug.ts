import type { App } from "vue";
import { ScreenComponentVue } from "@/packages/feature/screen/Screen"
// import { Plugin } from 'vue'

let plug = {
    install: function (app: any, ...options: any[]): any {
        app.component('Screen', ScreenComponentVue)
    },
}
export default plug;

export { VtronFile } from "@/packages/feature/core/FileSystem";
export { System, useSystem } from "@/packages/feature/system/index";
export { BrowserWindow } from "@/packages/feature/window/BrowserWindow"
export { Notify } from "@/packages/feature/notification/Notification";
export type { RootState, SystemOptions, WinApp } from "@/packages/type/type";