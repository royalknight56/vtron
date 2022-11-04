/**
 * @description: 让Dom元素可以缩放
 * @param {*}
 * @return {*}
 */
import { Ref } from "vue";
function isResize(mode: string, direction: string) {
    return mode.indexOf(direction) > -1
}
class ScaleElement {
    resizemode: Ref<string>

    // winX: number
    // winY: number
    winStartWidth: number
    winStartHeight: number
    mosStartX: number
    mosStartY: number
    posStartX: number
    posStartY: number
    resizeEvent: Function

    MIN_WIDTH = 200
    MIN_HEIGHT = 100

    constructor(resizemode: Ref, winWidth: number, winHeight: number, winX: number, winY: number) {
        this.resizemode = resizemode;

        // this.winX = winX
        // this.winY = winY
        this.resizeEvent = () => { };

        this.winStartWidth = winWidth;
        this.winStartHeight = winHeight;
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
    }
    startScale(e: MouseEvent | TouchEvent, dire: string, x: number, y: number, width: number, height: number) {
        this.resizemode.value = dire
        if (e instanceof MouseEvent) {
            this.mosStartX = e.pageX
            this.mosStartY = e.pageY
        } else {
            this.mosStartX = e.touches[0].pageX
            this.mosStartY = e.touches[0].pageY
        }
        this.winStartWidth = width
        this.winStartHeight = height
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
            let afterWidth = this.winStartWidth ;
            let afterHeight = this.winStartHeight;
            let afterX = this.posStartX;
            let afterY = this.posStartY;
            if (isResize(this.resizemode.value, 'r')) {
                afterWidth = Math.max(this.winStartWidth + pageX - this.mosStartX, this.MIN_WIDTH);
            }
            if (isResize(this.resizemode.value, 'l')) {
                afterWidth = Math.max(this.winStartWidth - pageX + this.mosStartX, this.MIN_WIDTH);
                afterX = Math.min(this.posStartX + (pageX - this.mosStartX), (this.posStartX + (this.winStartWidth - this.MIN_WIDTH)));
            }
            if (isResize(this.resizemode.value, 'b')) {
                afterHeight = Math.max(this.winStartHeight + pageY - this.mosStartY, this.MIN_HEIGHT)
            }
            if (isResize(this.resizemode.value, 't')) {
                afterHeight = Math.max(this.winStartHeight - pageY + this.mosStartY, this.MIN_HEIGHT)
                afterY = Math.min(this.posStartY + (pageY - this.mosStartY), (this.posStartY + (this.winStartHeight - this.MIN_HEIGHT)))
            }
            this.notify(afterWidth, afterHeight, afterX, afterY);
            return;
        }
    }

}

export {
    ScaleElement
}