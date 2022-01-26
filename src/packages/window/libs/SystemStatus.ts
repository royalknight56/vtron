/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-01-26 11:25:06
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/SystemStatus.ts
 * Need CodeReview 
 */
import { reactive } from "vue";
import {appconfig } from "../../appconfig";

interface statsCtrl{
    screen:"common"|"blue"|"close",
    islock:boolean,
    lockEvent:{
        [index: string]: Function
    },
    unlockEvent:{
        [index: string]: Function
    },
}

interface loginInfo{
    username:string,
    password:string,
}

class SystemStatus {
    private static instance: SystemStatus;
    stats: statsCtrl;
    private constructor() {
        this.stats = reactive({
            screen:"close",
            islock:false,
            lockEvent:{},
            unlockEvent:{}
        });
    }
    
    static getInstance() {
        if (this.instance == undefined) {
            this.instance = new SystemStatus()
        }
        return this.instance
    }
    _clearLockEvent(){
        this.stats.lockEvent={}
    }
    mountLockEvent(name:string,fun:Function){
        this.stats.lockEvent[name]=fun
    }
    mountUnlockEvent(name:string,fun:Function){
        this.stats.unlockEvent[name]=fun
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
        for(let key in this.stats.lockEvent){
            this.stats.lockEvent[key]()
        }
        
    }
    unlockScreen(username:string,password:string){
        this.stats.islock=false;
        for(let key in this.stats.unlockEvent){
            this.stats.unlockEvent[key]({username,password})
        }
    }
    notifyUnlock(username:string,password:string){
        for(let key in this.stats.unlockEvent){
            if(key !='hide'){
                this.stats.unlockEvent[key]({username,password})
            }
        }
    }
}
export {
    SystemStatus
}