import { reactive } from "vue";
import { DefineComponent,App } from "vue";
import { UnwrapNestedRefs } from "@vue/reactivity";

/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-12-18 20:42:26
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/DWM.ts
 */

interface WindowInfo {
    id: string,
    wid: number,
    title: string,
    zindex: number,
    ifShow: boolean,
    iftop: boolean,
    ifDestory: boolean,
    ifMax:boolean,
    width:number,
    height:number,
    icon:string,
    content:DefineComponent<{}, {}, any>,
    props:any,
    windowEventMap:{
        [index: string]:Function
    },
    // appPointer: App|null
}

interface windowInfoMapInter {
    [index: string]: WindowInfo
}
interface eventMapInter {
    [index: string]: Function
}
class DWM {
    private static instance: DWM;
    winnum: number;
    windowInfoMap: UnwrapNestedRefs<windowInfoMapInter>;
    zIndexIdArray: string[];
    eventMap:eventMapInter;
    private constructor() {
        this.winnum = 0;
        this.windowInfoMap = reactive({});
        this.zIndexIdArray = [];
        this.eventMap={}
    }
    static getInstance() {
        if (this.instance == undefined) {
            this.instance = new DWM()
        }
        return this.instance
    }
    
    
    getWindow(id: string):WindowInfo {
        return this.windowInfoMap[id]
    }

    getWinnum() {
        return this.winnum
    }
    getWinid():string {
        return "dragwinelementhash89103"+this.getWinnum()
    }
    registerWindow(id: string, 

        title: string,icon:string,width:number,height:number,

        content:DefineComponent<{}, {}, any>,
        props:any):WindowInfo {
        if (this.windowInfoMap[id]) {
            return this.windowInfoMap[id]
        } else {
            this.windowInfoMap[id] = reactive({
                id,
                wid: this.winnum,
                title,
                zindex: 0,
                ifShow: true,
                iftop: false,
                ifDestory: false,
                ifMax:false,
                width,
                height,
                icon:icon,
                content,
                props:props,
                appPointer:null,
                windowEventMap:{}
            });

            this.zIndexIdArray.push(id)
            this.winnum++;
            return this.windowInfoMap[id]
        }
    }
    addEventListener(id:string,name:string,func:Function){
        this.windowInfoMap[id].windowEventMap[name] = func
    }
    mountWindow(id:string,func:Function){
        this.windowInfoMap[id].windowEventMap['mount'] = func
    }
    private unRegisterWindow(id: string) {//删除在windowInfoMap中的存储
        delete this.windowInfoMap[id]
        let ind = this.zIndexIdArray.indexOf(id)
        this.zIndexIdArray.splice(ind, 1)
    }
    

    upSetWindowIndex(id: string):number {
        for (let key in this.windowInfoMap) {
            this.windowInfoMap[key].iftop = false
        }
        this.windowInfoMap[id].iftop = true

        let ind = this.zIndexIdArray.indexOf(id);
        this.zIndexIdArray.splice(ind, 1);
        this.zIndexIdArray.push(id);
        for (let i = 0; i < this.zIndexIdArray.length; i++) {
            this.windowInfoMap[this.zIndexIdArray[i]].zindex = i
        }
        return this.zIndexIdArray.length
    }
    hideWindow(id: string) {
        this.windowInfoMap[id].ifShow = false
    }
    showWindow(id: string) {
        this.windowInfoMap[id].ifShow = true
    }
    destoryWindow(id: string) {

        this.windowInfoMap[id].ifDestory = true
        this.windowInfoMap[id].windowEventMap['destroy']?.()
        // this.windowInfoMap[id].appPointer?.unmount()
        this.unRegisterWindow(id);
        // this.windowInfoMap[id].content?.unmounted?.()
        
        // let self = document.getElementById(id);
        // if (self) {
        //     // 拿到父节点:
        //     let parent = self.parentElement;
        //     // 删除:
        //     parent?.removeChild(self);
        // }
    }
    maxWindow(id: string) {
        if(this.windowInfoMap[id]){
            this.windowInfoMap[id].ifMax =!this.windowInfoMap[id]?.ifMax
        }
        
    }
    on(ev:string,func:Function){
        this.eventMap[ev]=func
    }
    emit(ev:string,...args:any){
        this.eventMap[ev]?.(...args)
    }

}
export {
    DWM,
    WindowInfo
}