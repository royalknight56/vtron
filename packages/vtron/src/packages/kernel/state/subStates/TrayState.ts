import { Tray } from '@/packages/services';
import { reactive } from 'vue';

export class TrayState {
  current: Array<Tray> = reactive([]);

  constructor() {}
  push(notify: Tray) {
    this.current.push(notify);
  }
}
