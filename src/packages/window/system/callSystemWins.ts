import { DragWindow } from "../libs/DragWindow";
import icon from "../../../assets/win.png";


import appInfo  from "./appInfo.vue";
import systemSetVue from "../system/systemSet.vue"

// import SystemSet  from "../system/SystemSet.vue";


function openInfo(info:any){
    //100, 100, '属性',icon,
    // 300,400, 
    let wininfo = new DragWindow(
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
let setwin = new DragWindow({
    title: '设置',
    width: 650,
    height: 400,
    // x: 100,
    // y: 100,
    content: systemSetVue
})
function openSetting() {
    setwin.show()
}
export{
    openInfo,
    openSetting
}