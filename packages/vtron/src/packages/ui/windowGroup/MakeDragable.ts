import { BrowserWindow, WindowStateEnum } from '@/packages/services';
import { DragElement } from '@/packages/ui/windowGroup/dom/DragElement';
import { Directive } from 'vue';

const vDragable: Directive = {
  mounted(el, binding) {
    const browserWindow = (binding.instance?.$ as any).provides.browserWindow as BrowserWindow;
    el.unback = makeDragable(el, browserWindow);
  },
  beforeUnmount(el) {
    el.unback?.();
  },
};

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
export { makeDragable, vDragable };
