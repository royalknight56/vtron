import { Notify } from '@/packages/services/notification/Notification';
import { reactive } from 'vue';

export class NotifyState {
  current: Array<Notify> = reactive([]);

  constructor() {}
  push(notify: Notify) {
    this.current.push(notify);
  }
  indexOf(notify: Notify) {
    return this.current.indexOf(notify);
  }
  splice(index: number, count: number) {
    this.current.splice(index, count);
  }
  clear() {
    this.current.splice(0, this.current.length);
  }
}
