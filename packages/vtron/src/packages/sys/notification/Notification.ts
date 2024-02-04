import { useSystem } from '../../kernel/system';
export interface NotifyConstructorOptions {
  title: string;
  content: string;
  timeout?: number;
}
export class Notify {
  public static idcount = 0;
  id: number;
  title: string;
  content: string;
  constructor(option: NotifyConstructorOptions) {
    this.title = option.title;
    this.content = option.content;
    this.id = Notify.idcount++;
    const sys = useSystem();
    sys._rootState.notify.push(this);
    sys._rootState.message.notify.push(this);
    setTimeout(() => {
      this.close();
    }, option.timeout || 5000);

    // // 检查浏览器是否支持通知
    // if ('Notification' in window) {
    //   // 请求通知权限
    //   Notification.requestPermission().then(function (permission) {
    //     if (permission === 'granted') {
    //       // 创建通知
    //       const notification = new Notification(option.title, {
    //         body: option.content,
    //       });

    //       // 点击通知时触发的事件
    //       notification.onclick = function () {
    //         // console.log('通知被点击了');
    //       };
    //     } else {
    //       // console.warn('用户拒绝了通知权限');
    //     }
    //   });
    // } else {
    //   // console.error('浏览器不支持通知');
    // }
  }
  close() {
    const sys = useSystem();
    sys._rootState.notify.splice(sys._rootState.notify.indexOf(this), 1);
  }
}
