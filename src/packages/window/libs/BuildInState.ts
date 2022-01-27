import { reactive } from "vue";
import { UnwrapNestedRefs } from "@vue/reactivity";


interface Notify{
    title:string,
    messages:string
}
class BIS {
    NotificationMap:UnwrapNestedRefs<{
        [key:string]:Notify
    }>;
    private static instance:BIS;
    private constructor(){
        this.NotificationMap = reactive({});
    }
    static getInstance(){
        if(!BIS.instance){
            BIS.instance = new BIS();
        }
        return BIS.instance;
    }
    static showNotification(id:string,title:string,messages:string){//显示通知
        this.getInstance().NotificationMap[id] = {
            messages:messages,
            title:title
        }
    }
    static hideNotification(id:string){//关闭通知
        delete this.getInstance().NotificationMap[id];
    }
    
}
export {
    BIS
}