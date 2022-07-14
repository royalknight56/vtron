import {System} from '@libs/System'

function getRandomId(prefix:string){
  return prefix+Math.random()+Date.now();
}

class Notify{
  system:System;
    constructor(system:System){
      this.system = system;
    }
    showNotification(title: string, messages: string) {//显示通知
      let id = getRandomId("notification");
      this.system.State.NotificationMap[id] = {
        messages: messages,
        title: title,
        isHidden: false
      }
      setTimeout(()=>{
        this.hideNotification(id);
      },3000)
    }
    hideNotification(id: string) {//关闭通知
      this.system.State.NotificationMap[id].isHidden = true;
      setTimeout(() => {
        delete this.system.State.NotificationMap[id];
      }, 400)
    }
    notify(title:string,messages:string){
        this.showNotification(title,messages);
    }
}
export {
    Notify
}