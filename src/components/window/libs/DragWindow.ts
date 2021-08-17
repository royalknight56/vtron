/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-17 14:49:00
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/DragWindow.ts
 */
import { createApp} from "@vue/runtime-dom";
import { DragElement } from "./DragElement";
import WindowTmpVue from "./WindowTmp.vue";


import {PageItem, WindowIPC} from "./WindowIPC"
import type { DefineComponent } from "@vue/runtime-core";



interface ctxInter{

    IPC:PageItem,
    props?:any
}
interface ctxPar{
    content:DefineComponent<{}, {}, any>,
    // use?: Array<any>,
    props?:any
}
class DragWindow extends DragElement{
    constructor(x:number,y:number,title:string,width:number,height:number,ctxpar:ctxPar){
        
        
        let div = document.createElement('div')
        div.className='dragwin'

        let id= WindowIPC.getInstance().getWinid();//获得一个id
        div.id=id
        document.getElementById('winid')?.appendChild(div);
        document.body.appendChild(div);

        let pageInfo = WindowIPC.getInstance().registerWindow(id,title,width,height,ctxpar.content,ctxpar.props);//在IPC中注册
        

        pageInfo.appPointer=createApp(WindowTmpVue,{ctx:pageInfo})
        pageInfo.appPointer.mount("#"+id)
        WindowIPC.getInstance().mountWindow(id,pageInfo.appPointer)
        super(x,y,div)
        WindowIPC.getInstance().upSetWindowIndex(id)

    }
}
export{
    DragWindow,
    ctxInter
}