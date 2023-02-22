import { App } from "vue";
import { ScreenComponentVue } from "../packages/feature/screen/Screen"
import { Plugin } from 'vue'
import WinBotton from "@/packages/components/WinButton.vue"
import WinCheckBox from "@/packages/components/WinCheckBox.vue"

let plug:Plugin = {
    install:function(app:App):void {
        app.component('Screen',ScreenComponentVue)
    },
    
}
export default plug;

export { System } from "../packages/feature/system/index";
export {
    WinBotton,
    WinCheckBox
}