import { useSystem } from '../system';
import { Eventer } from './Eventer';

function initEventer() {
  return new Eventer();
}
function emitEvent(event: string, data?: any) {
  useSystem().emitEvent(event, data);
}

function mountEvent(event: string | string[], callback: (source: string, data: any) => void): void {
  useSystem().mountEvent(event, callback);
}
function offEvent(event: string, callback?: (source: string, data: any) => void): void {
  useSystem().offEvent(event, callback);
}
function redirectEvent(source: string, target: string) {
  mountEvent(source, (source: string, data: any) => {
    emitEvent(target, data);
  });
}
export { initEventer, emitEvent, mountEvent, offEvent, redirectEvent };
