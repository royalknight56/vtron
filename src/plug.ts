import { App } from "vue";
import Win from "./packages/Win.vue"
import { Plugin } from 'vue'
import WinBotton from "@builtin/winComponent/WinButton.vue"
import WinCheckBox from "@builtin/winComponent/WinCheckBox.vue"

let plug:Plugin = {
    install:function(app:App):void {
        app.component('Win10',Win)
    },
    
}
export default plug;

export { System } from "./packages/window/libs/System";
export {
    WinBotton,
    WinCheckBox
}