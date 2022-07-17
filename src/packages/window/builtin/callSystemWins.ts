import { DragWindow } from "@/packages/window/libs/DragWindow";
import icon from "../../../assets/win.png";


import appInfo  from "@builtin/appInfo.vue";
import systemSetVue from "@builtin/systemSet.vue"
import {System} from '@libs/System'
// import SystemSet  from "../system/SystemSet.vue";


function openInfo(system:System, info:any){
    let wininfo = system.DragWindow(
    {
        x:100,
        y:100,
        title:'属性',
        icon:icon,
        width:300,
        height:400,
        content:appInfo,
        props:info.item,
        isScalable:false,
    })
    wininfo.show();
}

function openSetting(system:System) {
    let setwin = system.DragWindow({
        title: '设置',
        width: 650,
        height: 400,
        content: systemSetVue
    })
    setwin.show()
}
export{
    openInfo,
    openSetting
}