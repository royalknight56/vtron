import { Eventer, initEventListener } from '@/packages/kernel/event';
import { System } from '@/packages/plug';

export class EventOperations {
  system: System;

  private eventer: Eventer;

  constructor(system: System) {
    this.system = system;
    this.eventer = new Eventer();
  }

  initEventer() {
    initEventListener(); // 初始化事件侦听
    this.system.fs?.on('error', (err: string) => {
      this.system.emitError(err);
    });
  }

  getEventer() {
    return this.eventer;
  }
  emit(event: string, ...args: any[]) {
    this.emitEvent(event, ...args);
  }
  emitEvent(event: string, ...args: any[]) {
    const eventArray = event.split('.');
    eventArray.forEach((item, index) => {
      const tempEvent = eventArray.slice(0, index + 1).join('.');
      this.eventer.emit(tempEvent, event, args);
    });
    this.eventer.emit('system', event, args);
  }
  on(event: string, callback: (...args: any[]) => void): void {
    this.mountEvent(event, callback);
  }
  mountEvent(event: string | string[], callback: (...args: any[]) => void) {
    if (Array.isArray(event)) {
      event.forEach((item) => {
        this.mountEvent(item, callback);
      });
      return;
    } else {
      this.eventer.on(event, callback);
    }
  }

  offEvent(event?: string, callback?: (...args: any[]) => void): void {
    this.eventer.off(event, callback);
  }
}
