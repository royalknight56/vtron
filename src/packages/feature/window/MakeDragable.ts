import { BrowserWindow } from './BrowserWindow';
import { DragElement } from '@feature/window/dom/DragElement';
import { inject, provide, ref, watch } from 'vue';
import { WindowStateEnum } from './BrowserWindow';

function makeDragable(ref: HTMLElement, browserWindow: BrowserWindow) {
  let rect = ref.getBoundingClientRect();
  let dragAble = new DragElement(ref, rect.left, rect.top);
  dragAble.onDrag((x, y) => {
    if (browserWindow.windowInfo.disable) {
      return;
    }
    if (browserWindow.windowInfo.state !== WindowStateEnum.maximize) {
      browserWindow.windowInfo.x = x;
      browserWindow.windowInfo.y = y;
    }
  });
}
export { makeDragable };
