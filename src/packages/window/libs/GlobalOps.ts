/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-04-27 11:11:56
 * @Description: 操作全局的方法
 */
import state from "@state/index";
function getRandomId(prefix:string){
  return prefix+Math.random()+Date.now();
}
function showNotification(title: string, messages: string) {//显示通知
  let id = getRandomId("notification");
  state.NotificationMap[id] = {
    messages: messages,
    title: title,
    isHidden: false
  }
  setTimeout(()=>{
    hideNotification(id);
  },3000)
}
function hideNotification(id: string) {//关闭通知
  state.NotificationMap[id].isHidden = true;
  setTimeout(() => {
    delete state.NotificationMap[id];
  }, 400)
}
export {
  getRandomId,
  showNotification,
  hideNotification
}