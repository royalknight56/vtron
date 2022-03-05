/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-01-27 18:33:50
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

        // this.notify(this.posX, this.posY)
    }
    startMove(startX: number, startY: number) {
        this.startX = startX;
        this.startY = startY;
        this.posStartX = this.posX;
        this.posStartY = this.posY;
    }
    onDrag(fun: (a0: number, a1: number) => void) {
        this.notify = fun;
    }
}

class DragElement extends DragObj {
    ifDraging: boolean;
    el:any
    constructor(x: number, y: number) {
        super(x, y);
        this.ifDraging = false;
    }
    private sorption(posX: number, posY: number) {//使得窗口贴边吸附
        if(posX<10&&posX>-10){
            posX=0;
        }
        if(posY<10&&posY>-10){
            posY=0;
        }
        return [posX, posY]
    }
    mountDomEvent(element: any){
        this.el=element;
        this.ifDraging = false;
        element.style.left = this.posX + 'px';
        element.style.top = this.posY + 'px'
        element.addEventListener('mousedown', (ev:any)=>{
            this.startMove(ev.pageX, ev.pageY);
            this.ifDraging = true;
        })
        element.addEventListener("touchstart", (ev:TouchEvent)=>{
            this.startMove(ev.touches[0].pageX, ev.touches[0].pageY);
            this.ifDraging = true;
            // ev.preventDefault();

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
            
            if (this.ifDraging&&ev.buttons==1) {
                this.onMoving(ev.pageX, ev.pageY);
                let [posX, posY] = this.sorption(this.posX, this.posY);
                element.style.left = posX + 'px';
                element.style.top = posY + 'px'
                this.notify(posX, posY)
            }else if(this.ifDraging&&ev.buttons==0){
                this.ifDraging=false

            }
        })
        document.body.addEventListener("touchmove", (ev) => {
            if (this.ifDraging) {
                this.onMoving(ev.touches[0].pageX, ev.touches[0].pageY);
                let [posX, posY] = this.sorption(this.posX, this.posY);
                element.style.left = posX + 'px';
                element.style.top = posY + 'px'
                this.notify(posX, posY)

            }else if(this.ifDraging){
                this.ifDraging=false

            }
        })
    }

}

export {
    DragElement
}