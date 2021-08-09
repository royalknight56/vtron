/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-09 19:15:51
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/DragWindow.ts
 */
import { createApp, reactive, ref } from "@vue/runtime-dom";
import { DragElement } from "./DragElement";
import WindowTmpVue from "./WindowTmp.vue";

import {WindowIPC} from "./WindowIPC"


class DragWindow extends DragElement{
    zindex:number;
    
    constructor(x:number,y:number,title:string,width:number,height:number,app:any){
        
        
        let div = document.createElement('div')
        div.className='dragwin'

        let id= WindowIPC.getInstance().getWinid();//获得一个id
        div.id=id
        document.getElementById('winid')?.appendChild(div);
        // document.body.appendChild(div);


        let pageInfo = WindowIPC.getInstance().registerWindow(id,title);//在IPC中注册
        
        app.zindex=pageInfo.zindex

        app.value = createApp(WindowTmpVue,{title:title,width,height,app:app})
        
        app.IPC=pageInfo
        
        app.value.mount("#"+id)

        super(x,y,div)

        this.zindex=WindowIPC.getInstance().winnum;

    }
}
export{
    DragWindow
}