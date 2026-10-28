/*
 * @Author: Royal
 * @LastEditTime: 2022-03-08 20:32:19
 * @Description: 实现可移动Object,让Dom元素可以移动
 * Need CodeReview
 */
interface DragObjInter {
  posX: number;
  posY: number;
}
class DragObj implements DragObjInter {
  posX: number;
  posY: number;
  posStartX: number;
  posStartY: number;
  startX: number;
  startY: number;

  notify: (a0: number, a1: number) => void;
  constructor(x: number, y: number) {
    this.posX = x;
    this.posY = y;
    this.startX = 0;
    this.startY = 0;
    this.posStartX = 0;
    this.posStartY = 0;
    this.notify = () => {
      //
    };
  }
  onMoving(offsetX: number, offsetY: number) {
    this.posX = this.posStartX + offsetX - this.startX;
    this.posY = this.posStartY + offsetY - this.startY;
  }
  startMove(startX: number, startY: number, posX: number, posY: number) {
    this.startX = startX;
    this.startY = startY;
    this.posStartX = posX;
    this.posStartY = posY;
  }
  onDrag(fun: (a0: number, a1: number) => void) {
    this.notify = fun;
  }
}

class DragElement extends DragObj {
  ifDraging: boolean;
  canDrag: boolean;
  el: HTMLElement | null;
  outerElement: HTMLElement;
  constructor(
    element: HTMLElement,
    outerElement: HTMLElement,
    x: number,
    y: number,
    private readonly getPosition?: () => { x: number; y: number }
  ) {
    super(x, y);
    this.el = null;
    this.ifDraging = false;
    this.canDrag = true;
    this.outerElement = outerElement;
    this.mountDomEvent(element);
  }
  private sorption(posX: number, posY: number) {
    //使得窗口贴边吸附
    if (posX < 10 && posX > -10) {
      posX = 0;
    }
    if (posY < 10 && posY > -10) {
      posY = 0;
    }
    return [posX, posY];
  }
  onMouseupEvent = () => {
    this.ifDraging = false;
  };
  onMousemoveEvent = (ev: MouseEvent) => {
    if (this.ifDraging && ev.buttons == 1) {
      this.onMoving(ev.pageX, ev.pageY);
      const [posX, posY] = this.sorption(this.posX, this.posY);
      this.notify(posX, posY);
    } else if (this.ifDraging && ev.buttons == 0) {
      this.ifDraging = false;
    }
  };
  onTouchmoveEvent = (ev: TouchEvent) => {
    if (this.ifDraging) {
      this.onMoving(ev.touches[0].pageX, ev.touches[0].pageY);
      const [posX, posY] = this.sorption(this.posX, this.posY);
      this.notify(posX, posY);
    }
  };
  private startDrag(pageX: number, pageY: number) {
    let position = this.getPosition?.();
    if (!position) {
      const rect = this.el!.getBoundingClientRect();
      const parentRect = this.outerElement.getBoundingClientRect();
      position = { x: rect.left - parentRect.left, y: rect.top - parentRect.top };
    }
    // 窗口把手可能位于内容区内部；拖动起点必须使用被移动窗口的坐标。
    this.startMove(pageX, pageY, position.x, position.y);
    this.ifDraging = true;
  }
  mountDomEvent(element: HTMLElement) {
    this.el = element;
    this.ifDraging = false;

    element.addEventListener('mousedown', (ev: MouseEvent) => {
      if (this.canDrag) {
        this.startDrag(ev.pageX, ev.pageY);
      }
    });
    element.addEventListener(
      'touchstart',
      (ev: TouchEvent) => {
        if (this.canDrag) {
          this.startDrag(ev.touches[0].pageX, ev.touches[0].pageY);
        }
      },
      {
        passive: true,
      }
    );
    document.body.addEventListener('mouseup', this.onMouseupEvent);
    document.body.addEventListener('touchend', this.onMouseupEvent);
    document.body.addEventListener('mousemove', this.onMousemoveEvent);
    document.body.addEventListener('touchmove', this.onTouchmoveEvent);
  }
  unMount() {
    document.body.removeEventListener('mouseup', this.onMouseupEvent);
    document.body.removeEventListener('touchend', this.onMouseupEvent);
    document.body.removeEventListener('mousemove', this.onMousemoveEvent);
    document.body.removeEventListener('touchmove', this.onTouchmoveEvent);
  }
}

export { DragElement };
