import { reactive, ref, Ref, } from "vue";
import { UnwrapNestedRefs } from "@vue/reactivity";


/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-18 16:57:28
 * @Description: 右键菜单控制
 * @FilePath: /myindex/src/components/window/libs/MenuIPC.ts
 */
interface menuItem{
    name:string,
    func:Function
}
class MenuIPC {
    private static instance:MenuIPC;

    x:Ref<number>;
    y:Ref<number>;
    menuList:UnwrapNestedRefs<Array<menuItem>>;
    ifShow:Ref<boolean>;
    ifTopDown:Ref<boolean>;
    private constructor() {
        this.menuList=reactive([]);
        this.ifShow=ref(false);
        this.x=ref(0);
        this.y=ref(0);
        this.ifTopDown=ref(true)
    }
    static getInstance(){
        if(this.instance==undefined){
            this.instance=new MenuIPC()
        }
        return this.instance
    }
    callMenu(x:number,y:number,list:UnwrapNestedRefs<Array<menuItem>>){
        document.addEventListener("click",(e)=>{
            this.ifShow.value=false
        },{
            once:true
        })
        if(this.y.value>document.body.offsetHeight/2){
            this.ifTopDown.value=false
        }else{
            this.ifTopDown.value=true;
        }
        this.x.value=x;
        this.y.value=y
        this.ifShow.value=true
        this.menuList.splice(0,this.menuList.length);
        this.menuList.push(...list)
    }
}

export {
    MenuIPC,
    menuItem
}