
// import {showNotification,hideNotification}  from "@libs/GlobalOps";
import {NotificationMap} from "@state/index";
function getRandomId(prefix:string){
  return prefix+Math.random()+Date.now();
}
function showNotification(title: string, messages: string) {//显示通知
  let id = getRandomId("notification");
  NotificationMap[id] = {
    messages: messages,
    title: title,
    isHidden: false
  }
  setTimeout(()=>{
    hideNotification(id);
  },3000)
}
function hideNotification(id: string) {//关闭通知
  NotificationMap[id].isHidden = true;
  setTimeout(() => {
    delete NotificationMap[id];
  }, 400)
}

class Notify{
    constructor(){
    }
    notify(title:string,messages:string){
        showNotification(title,messages);
    }
}
export {
    Notify
}