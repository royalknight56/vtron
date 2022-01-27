import {BIS}  from "./BuildInState"
class Notify{
    constructor(title:string,messages:string){
        let id = this.getNotificationId();
        BIS.showNotification(id,title,messages);
        setTimeout(()=>{
            BIS.hideNotification(id);
        },3000)
    }
    private getNotificationId(){
        return "notification"+Math.random()+Date.now();
    }
}
export {
    Notify
}