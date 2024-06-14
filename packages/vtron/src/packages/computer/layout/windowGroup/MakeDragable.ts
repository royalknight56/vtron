import { DragElement } from '@/packages/computer/layout/windowGroup/dom/DragElement';
import { System } from '@/packages/kernel';
import { BrowserWindow, WindowStateEnum } from '@/packages/services';
import { Directive } from 'vue';

const vDragable: Directive = {
  mounted(el, binding) {
    const browserWindow = (binding.instance?.$ as any).provides.browserWindow as BrowserWindow;
    const system = (binding.instance?.$ as any).provides.system as System;
    el.unback = makeDragable(el, browserWindow, system.rootRef as HTMLElement);
  },
  beforeUnmount(el) {
    el.unback?.();
  },
};

function makeDragable(ref: HTMLElement, browserWindow: BrowserWindow, outerElement: HTMLElement) {
  const rect = ref.getBoundingClientRect();
  const dragAble = new DragElement(ref, outerElement, rect.left, rect.top);
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
export { makeDragable, vDragable };
