import { useSystem } from '../system';
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
    sys._rootState.system.notify.push(this);
    sys._rootState.system.message.notify.push(this);
    setTimeout(() => {
      this.close();
    }, option.timeout || 5000);
  }
  close() {
    const sys = useSystem();
    sys._rootState.system.notify.splice(sys._rootState.system.notify.indexOf(this), 1);
  }
}
