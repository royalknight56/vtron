import { App } from "vue";
import Win from "./packages/Win.vue"
import { Plugin } from 'vue'

let plug:Plugin = {
    install:function(app:App):void {
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