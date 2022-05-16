/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-04-28 19:16:31
 * @Description: 操作全局的方法
 */
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
export {
  getRandomId,
  showNotification,
  hideNotification
}