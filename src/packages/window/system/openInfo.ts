import { DragWindow } from "../libs/DragWindow";
import icon from "../../../assets/win.png";


import appInfo  from "../system/appInfo.vue";

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
    })
    wininfo.show();
}
export{
    openInfo
}