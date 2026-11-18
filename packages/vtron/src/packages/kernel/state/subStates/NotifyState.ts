import type { Notify } from '@/packages/services/notification/Notification';
import { reactive, shallowReactive } from 'vue';

export class NotifyState {
  current = shallowReactive<Notify[]>([]);
  history = shallowReactive<Notify[]>([]);
  center = reactive({ open: false, lastSeen: -1 });

  get unread() {
    return this.history.filter(note => note.id > this.center.lastSeen).length;
  }

  push(note: Notify, keepInCenter = true) {
    if (keepInCenter) {
      this.history.unshift(note);
      if (this.history.length > 100) this.history.pop();
    }
    if (this.center.open) this.center.lastSeen = note.id;
    else this.current.push(note);
  }

  setOpen(open: boolean) {
    this.center.open = open;
    if (open) {
      this.center.lastSeen = this.history[0]?.id ?? this.center.lastSeen;
      this.current.splice(0);
    }
  }

  indexOf(note: Notify) {
    return this.current.indexOf(note);
  }
  splice(index: number, count: number) {
    if (index >= 0) this.current.splice(index, count);
  }
  hideBanner(note: Notify) {
    this.splice(this.indexOf(note), 1);
  }
  remove(note: Notify) {
    this.hideBanner(note);
    const index = this.history.indexOf(note);
    if (index >= 0) this.history.splice(index, 1);
  }
  clear() {
    this.current.splice(0);
    this.history.splice(0);
  }
}
