import { App } from "vue";
import { ScreenComponentVue } from "@/packages/feature/screen/Screen"
import { Plugin } from 'vue'

let plug: Plugin = {
    install: function (app: App): void {
        app.component('Screen', ScreenComponentVue)
    },

}
export default plug;

export { System,useSystem } from "@/packages/feature/system/index";
export { BrowserWindow } from "@/packages/feature/window/BrowserWindow"
