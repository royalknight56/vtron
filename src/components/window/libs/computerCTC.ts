/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-09 16:46:53
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/computerCTC.ts
 */
import { reactive } from "vue";

interface statsCtrl{
    screen:"common"|"blue"|"close",
}

class computerCTC {
    private static instance: computerCTC;
    stats: statsCtrl;
    private constructor() {
        this.stats = reactive({
            screen:"close",
        });
    }
    static getInstance() {
        if (this.instance == undefined) {
            this.instance = new computerCTC()
        }
        return this.instance
    }
    closePower(){
        this.stats.screen='blue'
        setTimeout(()=>{
            this.stats.screen='close'
        },1000)
    }
    openPower(){
        this.stats.screen='close'
        setTimeout(()=>{
            this.stats.screen='blue'
        },100)
        setTimeout(()=>{
            this.stats.screen='common'
        },2000)
    }
    restartPower(){
        // this.stats.screen='blue'
        setTimeout(()=>{
            this.stats.screen='blue'
        },2000)

        setTimeout(()=>{
            this.stats.screen='close'
        },5000)

        setTimeout(()=>{
            window.location.reload()
        },6000)
    }
}
export {
    computerCTC
}