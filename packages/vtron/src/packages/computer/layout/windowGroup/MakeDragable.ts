import { DragElement } from '@/packages/computer/layout/windowGroup/dom/DragElement';
import { System } from '@/packages/kernel';
import { BrowserWindow, WindowStateEnum } from '@/packages/services';
import { Directive } from 'vue';

const vDragable: Directive = {
  mounted(el, binding) {
    if (binding.value === false) {
      return;
    }
    const browserWindow = (binding.instance?.$ as any).provides.browserWindow as BrowserWindow;
    const system = (binding.instance?.$ as any).provides.system as System;
    el.unback = makeDragable(el, browserWindow, system.rootRef as HTMLElement);
  },
  beforeUnmount(el) {
    el.unback?.();
  },
};

function makeDragable(ref: HTMLElement, browserWindow: BrowserWindow, outerElement: HTMLElement) {
  const dragAble = new DragElement(
    ref,
    outerElement,
    browserWindow.windowInfo.x,
    browserWindow.windowInfo.y,
    () => ({ x: browserWindow.windowInfo.x, y: browserWindow.windowInfo.y })
  );
  dragAble.onDrag((x, y) => {
    if (browserWindow.windowInfo.disable || browserWindow.windowInfo.state === WindowStateEnum.maximize) {
      return;
    }
    browserWindow.windowInfo.x = x;
    browserWindow.windowInfo.y = y;
    browserWindow.emit('move', x, y);
  });
  return () => {
    dragAble.unMount();
  };
}
export { makeDragable, vDragable };
