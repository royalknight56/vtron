import { Eventer } from './Eventer';
const eventer = new Eventer();
function initEventer() {
  return eventer;
}
function useEventer() {
  return eventer;
}
function emitEvent(event: string, data?: any) {
  const eventArray = event.split('.');
  eventArray.forEach((item, index) => {
    const tempEvent = eventArray.slice(0, index + 1).join('.');
    eventer.emit(tempEvent, event, data);
  });
  eventer.emit('system', event, data);
}
function mountEvent(event: string[], callback: (source: string, data: any) => void): void;
function mountEvent(event: string, callback: (source: string, data: any) => void): void;
function mountEvent(event: string | string[], callback: (source: string, data: any) => void): void {
  if (Array.isArray(event)) {
    event.forEach((item) => {
      mountEvent(item, callback);
    });
    return;
  } else {
    eventer.on(event, callback);
  }
}
function redirectEvent(source: string, target: string) {
  mountEvent(source, (source: string, data: any) => {
    emitEvent(target, data);
  });
}
export { Eventer, initEventer, useEventer, emitEvent, mountEvent, redirectEvent };
