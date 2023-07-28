import { BrowserWindow } from './BrowserWindow';
import { DragElement } from '@feature/window/dom/DragElement';
import { WindowStateEnum } from './BrowserWindow';

function makeDragable(ref: HTMLElement, browserWindow: BrowserWindow) {
  const rect = ref.getBoundingClientRect();
  const dragAble = new DragElement(ref, rect.left, rect.top);
  dragAble.onDrag((x, y) => {
    if (browserWindow.windowInfo.disable) {
      return;
    }
    if (browserWindow.windowInfo.state !== WindowStateEnum.maximize) {
      browserWindow.windowInfo.x = x;
      browserWindow.windowInfo.y = y;
    }
  });
  return () => {
    dragAble.unMount();
  };
}
export { makeDragable };
