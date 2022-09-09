/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:41:07
 * @Description: 管理系统状态，开机/重启/关机
 * @FilePath: /myindex/src/components/window/libs/Power.ts
 * Need CodeReview 
 */
import { reactive } from "vue";
import {System} from '@libs/System'

interface stateCtrl{
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

class Power {
    state: stateCtrl;
    private system:System
    constructor(system:System) {
        this.system = system;
        this.state = reactive({
            screen:"close",
            islock:false,
            lockEvent:{},
            unlockEvent:{}
        });
    }
    
    _clearLockEvent(){
        this.state.lockEvent={}
    }
    mountLockEvent(name:string,fun:Function){
        this.state.lockEvent[name]=fun
    }
    mountUnlockEvent(name:string,fun:Function){
        this.state.unlockEvent[name]=fun
    }
    closePower(){
        this.state.screen='blue'
        setTimeout(()=>{
            this.state.screen='close'
        },1000)
    }
    openPower(){
        if(this.system.SystemConfig.config.start_time==0){
            this.state.screen='common'
        }else{
            this.state.screen='close'
        }

        setTimeout(()=>{
            this.state.screen='blue'
        },this.system.SystemConfig.config.start_time/2)
        setTimeout(()=>{
            this.state.screen='common'
        },this.system.SystemConfig.config.start_time)
    }
    restartPower(){
        // this.state.screen='blue'
        setTimeout(()=>{
            this.state.screen='blue'
        },400)

        setTimeout(()=>{
            this.state.screen='close'
        },3000)

        setTimeout(()=>{
            this.openPower()
        },4000)
    }
    // lockScreen(){
    //     this.state.islock=true
    //     for(let key in this.state.lockEvent){
    //         this.state.lockEvent[key]()
    //     }
        
    // }
    // unlockScreen(username:string,password:string){
    //     this.state.islock=false;
    //     for(let key in this.state.unlockEvent){
    //         this.state.unlockEvent[key]({username,password})
    //     }
    // }
    // notifyUnlock(username:string,password:string){
    //     for(let key in this.state.unlockEvent){
    //         if(key !='hide'){
    //             this.state.unlockEvent[key]({username,password})
    //         }
    //     }
    // }
}
export {
    Power
}