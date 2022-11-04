/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:41:07
 * @Description: 管理系统状态，开机/重启/关机
 * @FilePath: /myindex/src/components/window/libs/Power.ts
 * Need CodeReview 
 */
import { reactive } from "vue";
import {System} from '@libs/System'
import { emitEvents } from '@/packages/window/utils/index';

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
        emitEvents(this.system,"start.close.power");
        setTimeout(()=>{
            this.state.screen='close'
            emitEvents(this.system,"over.close.power");

        },1000)
    }
    openPower(){
        emitEvents(this.system,"start.open.power");
        if(this.system.SystemConfig.config.start_time==0){
            this.state.screen='common'
            emitEvents(this.system,"over.open.power");
        }else{
            this.state.screen='close'
            setTimeout(()=>{
                this.state.screen='blue'
            },this.system.SystemConfig.config.start_time/2)
            setTimeout(()=>{
                this.state.screen='common'
                emitEvents(this.system,"over.open.power");
            },this.system.SystemConfig.config.start_time)
        }

        
    }
    restartPower(){
        emitEvents(this.system,"start.restart.power");
        this.closePower();
        setTimeout(()=>{
            this.openPower()
        },4000)
    }
}
export {
    Power
}