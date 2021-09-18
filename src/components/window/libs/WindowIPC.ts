import { reactive } from "vue";
import { DefineComponent,App } from "vue";
import { UnwrapNestedRefs } from "@vue/reactivity";

/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-09-18 17:01:21
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/WindowIPC.ts
 */

interface PageItem {
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

interface pageMapInter {
    [index: string]: PageItem
}
interface eventMapInter {
    [index: string]: Function
}
class WindowIPC {
    private static instance: WindowIPC;
    winnum: number;
    pageMap: UnwrapNestedRefs<pageMapInter>;
    pageIndex: string[];
    eventMap:eventMapInter;
    private constructor() {
        this.winnum = 0;
        this.pageMap = reactive({});
        this.pageIndex = [];
        this.eventMap={}
    }
    static getInstance() {
        if (this.instance == undefined) {
            this.instance = new WindowIPC()
        }
        return this.instance
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
        props:any):PageItem {
        if (this.pageMap[id]) {
            return this.pageMap[id]
        } else {
            this.pageMap[id] = reactive({
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

            this.pageIndex.push(id)
            this.winnum++;
            return this.pageMap[id]
        }
    }
    mountWindowEventMap(id:string,name:string,func:Function){
        this.pageMap[id].windowEventMap[name] = func
    }
    mountWindow(id:string,func:Function){
        this.pageMap[id].windowEventMap['mount'] = func
    }
    private unRegisterWindow(id: string) {//删除在pageMap中的存储
        console.log(this.pageMap)
        delete this.pageMap[id]
        // console.log(this.pageMap)
        let ind = this.pageIndex.indexOf(id)
        // console.log(this.pageIndex)
        this.pageIndex.splice(ind, 1)
    }

    upSetWindowIndex(id: string):number {
        for (let key in this.pageMap) {
            this.pageMap[key].iftop = false
        }
        this.pageMap[id].iftop = true

        let ind = this.pageIndex.indexOf(id);
        this.pageIndex.splice(ind, 1);
        this.pageIndex.push(id);
        for (let i = 0; i < this.pageIndex.length; i++) {
            this.pageMap[this.pageIndex[i]].zindex = i
        }
        return this.pageIndex.length
    }
    hideWindow(id: string) {
        this.pageMap[id].ifShow = false
    }
    showWindow(id: string) {
        this.pageMap[id].ifShow = true
    }
    destoryWindow(id: string) {

        this.pageMap[id].ifDestory = true
        this.pageMap[id].windowEventMap['destroy']()
        // this.pageMap[id].appPointer?.unmount()
        this.unRegisterWindow(id);
        // this.pageMap[id].content?.unmounted?.()
        
        let self = document.getElementById(id);
        if (self) {
            // 拿到父节点:
            let parent = self.parentElement;
            // 删除:
            parent?.removeChild(self);
        }
    }
    maxWindow(id: string) {
        if(this.pageMap[id]){
            this.pageMap[id].ifMax =!this.pageMap[id]?.ifMax
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
    WindowIPC,
    PageItem
}