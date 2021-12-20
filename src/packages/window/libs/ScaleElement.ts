import { Ref } from "vue";

class ScaleElement {
    resizemode: Ref<string>
    winWidth: Ref<number>
    winHeight: Ref<number>

    winStartX:number
    winStartY:number
    mosStartX: number
    mosStartY: number
    resizeEvent:Function|null
    
    constructor(resizemode: Ref, winWidth: Ref, winHeight: Ref,resizeEvent:Function) {
        this.resizemode = resizemode;
        this.winWidth = winWidth;
        this.winHeight = winHeight;
        this.resizeEvent = resizeEvent;

        this.winStartX = 0;
        this.winStartY = 0;
        this.mosStartX = 0;
        this.mosStartY = 0;
        this.mount()
        
        
    }
    mount() {
        document.addEventListener("touchmove", this.moveListener.bind(this))
        document.addEventListener('mousemove', this.moveListener.bind(this))
        document.addEventListener("mouseup", () => {
            this.resizemode.value = 'null'
        })
        document.addEventListener("touchend", () => {
            this.resizemode.value = 'null'
        })
        document.addEventListener('drag', ()=>{
            this.resizemode.value = 'null'
        })
    }
    startScale(e: MouseEvent|TouchEvent, dire: string) {
        this.resizemode.value = dire
        if(e instanceof MouseEvent){
            this.mosStartX = e.pageX
            this.mosStartY = e.pageY
        }else{
            this.mosStartX = e.touches[0].pageX
            this.mosStartY = e.touches[0].pageY
        }
        this.winStartX = this.winWidth.value
        this.winStartY = this.winHeight.value
        
    }
    notify(width:number,height:number) {
        if(this.resizeEvent){
            this.resizeEvent(width,height)
        }
    }
    moveListener(e: MouseEvent | TouchEvent) {
        // e.preventDefault()
        if (e instanceof MouseEvent) {
            if (e.buttons == 1) {

            } else {
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

        if (this.resizemode.value == 'r') {
            this.winWidth.value = this.winStartX + pageX - this.mosStartX
            if (this.winWidth.value < 170) {
                this.winWidth.value = 170
            } else {
                this.notify(this.winWidth.value, this.winHeight.value)
            }
        } else if (this.resizemode.value == 'b') {
            this.winHeight.value = this.winStartY + pageY - this.mosStartY
            if (this.winHeight.value < 100) {
                this.winHeight.value = 100
            } else {
                this.notify(this.winWidth.value, this.winHeight.value)
            }
        } else if (this.resizemode.value == 'rb') {
            this.winWidth.value = this.winStartX + pageX - this.mosStartX
            this.winHeight.value = this.winStartY + pageY - this.mosStartY
            if (this.winWidth.value < 170) {
                this.winWidth.value = 170
                if (this.winHeight.value < 100) {
                    this.winHeight.value = 100
                } else {
                    this.notify(this.winWidth.value, this.winHeight.value)
                }
            } else {
                if (this.winHeight.value < 100) {
                    this.winHeight.value = 100
                }
                this.notify(this.winWidth.value, this.winHeight.value)
            }

        } else {
            return
        }

        // e.stopPropagation()
    }

}

export {
    ScaleElement
}