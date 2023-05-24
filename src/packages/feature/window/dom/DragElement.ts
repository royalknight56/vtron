/*
 * @Author: Royal
 * @LastEditTime: 2022-03-08 20:32:19
 * @Description: 实现可移动Object,让Dom元素可以移动
 * Need CodeReview 
 */
interface DragObjInter {
    posX: number,
    posY: number,
}
class DragObj implements DragObjInter {
    posX: number;
    posY: number;
    posStartX: number;
    posStartY: number;
    startX: number;
    startY: number;

    notify: Function;
    constructor(x: number, y: number) {
        this.posX = x;
        this.posY = y;
        this.startX = 0;
        this.startY = 0;
        this.posStartX = 0;
        this.posStartY = 0;
        this.notify = () => { };
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
    el: any
    constructor(element: any,x: number, y: number) {
        super(x, y);
        this.ifDraging = false;
        this.canDrag = true;
        this.mountDomEvent(element);
    }
    private sorption(posX: number, posY: number) {//使得窗口贴边吸附
        if (posX < 10 && posX > -10) {
            posX = 0;
        }
        if (posY < 10 && posY > -10) {
            posY = 0;
        }
        return [posX, posY]
    }
    mountDomEvent(element: any) {
        this.el = element;
        this.ifDraging = false;
        element.addEventListener('mousedown', (ev: any) => {
            if (this.canDrag) {
                let rect = this.el.getBoundingClientRect();
                this.startMove(ev.pageX, ev.pageY, rect.left, rect.top);
                this.ifDraging = true;
            }
        })
        element.addEventListener("touchstart", (ev: TouchEvent) => {
            if (this.canDrag) {
                let rect = this.el.getBoundingClientRect();
                this.startMove(ev.touches[0].pageX, ev.touches[0].pageY, rect.left, rect.top);
                this.ifDraging = true;
            }
        }, {
            passive: true
        })
        document.body.addEventListener('mouseup', (ev) => {
            this.ifDraging = false;
        })
        document.body.addEventListener("touchend", (ev) => {
            this.ifDraging = false;
        })
        document.body.addEventListener('mousemove', (ev) => {

            if (this.ifDraging && ev.buttons == 1) {
                this.onMoving(ev.pageX, ev.pageY);
                let [posX, posY] = this.sorption(this.posX, this.posY);
                this.notify(posX, posY)
            } else if (this.ifDraging && ev.buttons == 0) {
                this.ifDraging = false
            }
        })
        document.body.addEventListener("touchmove", (ev) => {
            if (this.ifDraging) {
                this.onMoving(ev.touches[0].pageX, ev.touches[0].pageY);
                let [posX, posY] = this.sorption(this.posX, this.posY);
                this.notify(posX, posY)
            } else if (this.ifDraging) {
                this.ifDraging = false

            }
        })
    }

}

export {
    DragElement
}