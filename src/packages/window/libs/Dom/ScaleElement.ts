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
    winX: Ref<number>
    winY: Ref<number>
    winStartX: number
    winStartY: number
    mosStartX: number
    mosStartY: number
    posStartX: number
    posStartY: number
    resizeEvent: Function

    MIN_WIDTH = 200
    MIN_HEIGHT = 100

    constructor(resizemode: Ref, winWidth: Ref, winHeight: Ref, winX: Ref, winY: Ref) {
        this.resizemode = resizemode;
        this.winWidth = winWidth;
        this.winHeight = winHeight;
        this.winX = winX
        this.winY = winY
        this.resizeEvent = () => { };

        this.winStartX = 0;
        this.winStartY = 0;
        this.mosStartX = 0;
        this.mosStartY = 0;
        this.posStartX = 0;
        this.posStartY = 0;

        this.mount()


    }
    mount() {
        document.addEventListener("touchmove", (e)=>{
            this.moveListener(e);
            document.addEventListener("touchend",()=>{
                this.resizemode.value = 'null'
            })
        })
        document.addEventListener("mousemove", (e)=>{
            this.moveListener(e);
            document.addEventListener("mouseup",()=>{
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
    startScale(e: MouseEvent | TouchEvent, dire: string) {
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
        this.posStartX = this.winX.value
        this.posStartY = this.winY.value
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
        } else if (this.resizemode.value === 'r') {
            this.winWidth.value = Math.max(this.winStartX + pageX - this.mosStartX, this.MIN_WIDTH);
            this.notify(this.winWidth.value, this.winHeight.value, this.winX.value, this.winY.value)
        } else if (this.resizemode.value === 'b') {
            this.winHeight.value = Math.max(this.winStartY + pageY - this.mosStartY, this.MIN_HEIGHT);
            this.notify(this.winWidth.value, this.winHeight.value, this.winX.value, this.winY.value)
        } else if (this.resizemode.value === 'rb') {
            this.winWidth.value = Math.max(this.winStartX + pageX - this.mosStartX, this.MIN_WIDTH);
            this.winHeight.value = Math.max(this.winStartY + pageY - this.mosStartY, this.MIN_HEIGHT);
            this.notify(this.winWidth.value, this.winHeight.value, this.winX.value, this.winY.value);
        } else if (this.resizemode.value === 'l') {// 需改变位置的缩放方向
            this.winWidth.value = Math.max(this.winStartX - pageX + this.mosStartX, this.MIN_WIDTH);
            this.notify(this.winWidth.value, this.winHeight.value, this.posStartX + (pageX - this.mosStartX), this.winY.value);
        } else if (this.resizemode.value === 't') {
            this.winHeight.value = Math.max(this.winStartY - pageY + this.mosStartY, this.MIN_HEIGHT);
            this.notify(this.winWidth.value, this.winHeight.value, this.winX.value, this.posStartY + (pageY - this.mosStartY))
        } else if (this.resizemode.value === 'lt') {
            this.winWidth.value = Math.max(this.winStartX - pageX + this.mosStartX, this.MIN_WIDTH);
            this.winHeight.value = Math.max(this.winStartY - pageY + this.mosStartY, this.MIN_HEIGHT);
            this.notify(this.winWidth.value, this.winHeight.value, this.posStartX + (pageX - this.mosStartX), this.posStartY + (pageY - this.mosStartY))
        } else if (this.resizemode.value === 'lb') {
            this.winWidth.value = Math.max(this.winStartX - pageX + this.mosStartX, this.MIN_WIDTH);
            this.winHeight.value = Math.max(this.winStartY + pageY - this.mosStartY, this.MIN_HEIGHT);
            this.notify(this.winWidth.value, this.winHeight.value, this.posStartX + (pageX - this.mosStartX), this.winY.value)
        } else if (this.resizemode.value === 'rt') {
            this.winWidth.value = Math.max(this.winStartX + pageX - this.mosStartX, this.MIN_WIDTH);
            this.winHeight.value = Math.max(this.winStartY - pageY + this.mosStartY, this.MIN_HEIGHT);
            this.notify(this.winWidth.value, this.winHeight.value, this.winX.value, this.posStartY + (pageY - this.mosStartY))
        }


        // if (this.resizemode.value == 'r') {
        //     this.winWidth.value = this.winStartX + pageX - this.mosStartX
        //     if (this.winWidth.value < this.MIN_WIDTH) {
        //         this.winWidth.value = this.MIN_WIDTH
        //     } else {
        //         this.notify(this.winWidth.value, this.winHeight.value)
        //     }
        // } else if (this.resizemode.value == 'b') {
        //     this.winHeight.value = this.winStartY + pageY - this.mosStartY
        //     if (this.winHeight.value < this.MIN_HEIGHT) {
        //         this.winHeight.value = this.MIN_HEIGHT
        //     } else {
        //         this.notify(this.winWidth.value, this.winHeight.value)
        //     }
        // } else if (this.resizemode.value == 'rb') {
        //     this.winWidth.value = this.winStartX + pageX - this.mosStartX
        //     this.winHeight.value = this.winStartY + pageY - this.mosStartY
        //     if (this.winWidth.value < this.MIN_WIDTH) {
        //         this.winWidth.value = this.MIN_WIDTH
        //         if (this.winHeight.value < this.MIN_HEIGHT) {
        //             this.winHeight.value = this.MIN_HEIGHT
        //         } else {
        //             this.notify(this.winWidth.value, this.winHeight.value)
        //         }
        //     } else {
        //         if (this.winHeight.value < this.MIN_HEIGHT) {
        //             this.winHeight.value = this.MIN_HEIGHT
        //         }
        //         this.notify(this.winWidth.value, this.winHeight.value)
        //     }

        // } else {
        //     return
        // }
    }

}

export {
    ScaleElement
}