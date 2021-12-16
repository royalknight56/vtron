import { DragWindow } from "../libs/DragWindow";
import icon from "../../../assets/win.png";


import appInfo  from "../system/appInfo.vue";

function openInfo(info:any){
    let wininfo = new DragWindow(100, 100, '属性',icon,
    300,400, {content:appInfo,
    props:info.item
    })
    wininfo.show();
}
export{
    openInfo
}