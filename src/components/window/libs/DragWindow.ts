/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-25 10:57:04
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/DragWindow.ts
 */
import { createApp,defineComponent} from "vue";
import { DragElement } from "./DragElement";
import WindowTmpVue from "./WindowTmp.vue";


import {PageItem, WindowIPC} from "./WindowIPC"
import type { DefineComponent } from "vue";



interface ctxInter{

    IPC:PageItem,
    props?:any
}
interface ctxPar{
    content:ReturnType<typeof defineComponent>,
    //DefineComponent<{}, {}, any>
    // use?: Array<any>,
    props?:any
}
class DragWindow extends DragElement{
    constructor(x:number,y:number,title:string,width:number,height:number,ctxpar:ctxPar,use?:any){
        
        
        let div = document.createElement('div')
        // div.className='dragwin'

        let id= WindowIPC.getInstance().getWinid();//获得一个id
        div.id=id
        document.getElementById('winid')?.appendChild(div);
        // document.body.appendChild(div);

        let pageInfo = WindowIPC.getInstance().registerWindow(id,title,width,height,ctxpar.content,ctxpar.props);//在IPC中注册
        

        pageInfo.appPointer=createApp(WindowTmpVue,{ctx:pageInfo})
        
        if(use){

            for(let i=0;i<use.length;i++){
                pageInfo.appPointer.use(use[i])
            }
        }

        pageInfo.appPointer.config.warnHandler = function(msg, vm, trace) {//未接受props警告静默
            // `trace` 是组件的继承关系追踪
            if(msg=='Extraneous non-props attributes (ctx) were passed to component but could not be automatically inherited because component renders fragment or text root nodes.'){

            }else{
                console.warn(msg)
            }
          }
          

        // let res = pageInfo.appPointer.mount("#"+id)
        let res = pageInfo.appPointer.mount(div)
        WindowIPC.getInstance().mountWindow(id,pageInfo.appPointer)

        super(x,y,div.firstChild)
        
        WindowIPC.getInstance().upSetWindowIndex(id)

    }
}
export{
    DragWindow,
    ctxInter
}