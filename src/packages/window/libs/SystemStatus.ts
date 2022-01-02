/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-12-27 20:53:42
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/SystemStatus.ts
 * Need CodeReview 
 */
import { reactive } from "vue";
import {appconfig } from "../../appconfig";

interface statsCtrl{
    screen:"common"|"blue"|"close",
    islock:boolean,
    lockEvent:Function,
    unlockEvent:Function,
}

class SystemStatus {
    private static instance: SystemStatus;
    stats: statsCtrl;
    private constructor() {
        this.stats = reactive({
            screen:"close",
            islock:false,
            lockEvent:()=>{},
            unlockEvent:()=>{}
        });
    }
    
    static getInstance() {
        if (this.instance == undefined) {
            this.instance = new SystemStatus()
        }
        return this.instance
    }
    _mountLockEvent(fun:Function){
        this.stats.lockEvent=fun
    }
    _mountUnlockEvent(fun:Function){
        this.stats.unlockEvent=fun
    }
    closePower(){
        this.stats.screen='blue'
        setTimeout(()=>{
            this.stats.screen='close'
        },1000)
    }
    openPower(){
        if(appconfig.start_time==0){
            this.stats.screen='common'
        }else{
            this.stats.screen='close'
        }

        setTimeout(()=>{
            this.stats.screen='blue'
        },appconfig.start_time/2)
        setTimeout(()=>{
            this.stats.screen='common'
        },appconfig.start_time)
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
    lockScreen(){
        this.stats.islock=true
        this.stats.lockEvent()
    }
    unlockScreen(){
        this.stats.islock=false;
        this.stats.unlockEvent()
    }
}
export {
    SystemStatus
}