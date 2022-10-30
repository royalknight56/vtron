/**
 * @description: 让Dom元素可以缩放
 * @param {*}
 * @return {*}
 */
import { Ref } from "vue";

class ScaleElement {
    resizemode: Ref<string>
    winWidth: Ref<number>
    winHeight: Ref<number>
    // winX: number
    // winY: number
    winStartX: number
    winStartY: number
    mosStartX: number
    mosStartY: number
    posStartX: number
    posStartY: number
    resizeEvent: Function

    MIN_WIDTH = 200
    MIN_HEIGHT = 100

    constructor(resizemode: Ref, winWidth: Ref, winHeight: Ref, winX: number, winY: number) {
        this.resizemode = resizemode;
        this.winWidth = winWidth;
        this.winHeight = winHeight;
        // this.winX = winX
        // this.winY = winY
        this.resizeEvent = () => { };

        this.winStartX = 0;
        this.winStartY = 0;
        this.mosStartX = 0;
        this.mosStartY = 0;
        this.posStartX = winX;
        this.posStartY = winY;

        this.mount()


    }
    mount() {
        document.addEventListener("touchmove", (e) => {
            this.moveListener(e);
            document.addEventListener("touchend", () => {
                this.resizemode.value = 'null'
            })
        })
        document.addEventListener("mousemove", (e) => {
            this.moveListener(e);
            document.addEventListener("mouseup", () => {
                this.resizemode.value = 'null'
            })
        })
        // document.addEventListener('mousemove', this.moveListener.bind(this))

        // document.addEventListener("mouseup", () => {
        //     this.resizemode.value = 'null'
        // })
        // document.addEventListener("touchend", () => {
        //     this.resizemode.value = 'null'
        // })

    }
    startScale(e: MouseEvent | TouchEvent, dire: string, x: number, y: number) {
        this.resizemode.value = dire
        if (e instanceof MouseEvent) {
            this.mosStartX = e.pageX
            this.mosStartY = e.pageY
        } else {
            this.mosStartX = e.touches[0].pageX
            this.mosStartY = e.touches[0].pageY
        }
        this.winStartX = this.winWidth.value
        this.winStartY = this.winHeight.value
        this.posStartX = x
        this.posStartY = y
    }
    onResize(fun: (a0: number, a1: number, x: number, y: number) => void) {
        this.resizeEvent = fun
    }
    notify(width: number, height: number, x?: number, y?: number) {
        if (this.resizeEvent) {
            this.resizeEvent(width, height, x, y)
        }
    }
    moveListener(e: MouseEvent | TouchEvent) {
        if (e instanceof MouseEvent) {
            if (e.buttons !== 1) {
                this.resizemode.value = 'null'
                return
            }
        }

        let pageX = 0;
        let pageY = 0;
        if (e instanceof MouseEvent) {
            pageX = e.pageX;
            pageY = e.pageY;
        } else {
            pageX = e.touches[0].pageX;
            pageY = e.touches[0].pageY;
        }
        if (this.resizemode.value === 'null') {
            return
        } else {

            if (this.resizemode.value === 'r') {
                this.winWidth.value = Math.max(this.winStartX + pageX - this.mosStartX, this.MIN_WIDTH);
                this.notify(this.winWidth.value, this.winHeight.value, this.posStartX, this.posStartY)
            } else if (this.resizemode.value === 'b') {
                this.winHeight.value = Math.max(this.winStartY + pageY - this.mosStartY, this.MIN_HEIGHT);
                this.notify(this.winWidth.value, this.winHeight.value, this.posStartX, this.posStartY)
            } else if (this.resizemode.value === 'rb') {
                this.winWidth.value = Math.max(this.winStartX + pageX - this.mosStartX, this.MIN_WIDTH);
                this.winHeight.value = Math.max(this.winStartY + pageY - this.mosStartY, this.MIN_HEIGHT);
                this.notify(this.winWidth.value, this.winHeight.value, this.posStartX, this.posStartY);
            } else if (this.resizemode.value === 'l') {// 需改变位置的缩放方向
                this.winWidth.value = Math.max(this.winStartX - pageX + this.mosStartX, this.MIN_WIDTH);
                this.notify(this.winWidth.value, this.winHeight.value, Math.min(this.posStartX + (pageX - this.mosStartX), this.posStartX), this.posStartY);

            } else if (this.resizemode.value === 't') {
                this.winHeight.value = Math.max(this.winStartY - pageY + this.mosStartY, this.MIN_HEIGHT);
                this.notify(this.winWidth.value, this.winHeight.value, this.posStartX, Math.min(this.posStartY + (pageY - this.mosStartY), this.posStartY));

            } else if (this.resizemode.value === 'lt') {
                this.winWidth.value = Math.max(this.winStartX - pageX + this.mosStartX, this.MIN_WIDTH);
                this.winHeight.value = Math.max(this.winStartY - pageY + this.mosStartY, this.MIN_HEIGHT);
                this.notify(this.winWidth.value, this.winHeight.value, Math.min(this.posStartX + (pageX - this.mosStartX), this.posStartX),  Math.min(this.posStartY + (pageY - this.mosStartY), this.posStartY))
            } else if (this.resizemode.value === 'lb') {
                this.winWidth.value = Math.max(this.winStartX - pageX + this.mosStartX, this.MIN_WIDTH);
                this.winHeight.value = Math.max(this.winStartY + pageY - this.mosStartY, this.MIN_HEIGHT);
                this.notify(this.winWidth.value, this.winHeight.value, Math.min(this.posStartX + (pageX - this.mosStartX), this.posStartX), this.posStartY)

            } else if (this.resizemode.value === 'rt') {
                this.winWidth.value = Math.max(this.winStartX + pageX - this.mosStartX, this.MIN_WIDTH);
                this.winHeight.value = Math.max(this.winStartY - pageY + this.mosStartY, this.MIN_HEIGHT);
                this.notify(this.winWidth.value, this.winHeight.value, this.posStartX, Math.min(this.posStartY + (pageY - this.mosStartY), this.posStartY))

            }
        }
    }

}

export {
    ScaleElement
}