/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-03-31 17:49:37
 * @Description: 管理系统状态，开机/重启/关机
 * @FilePath: /myindex/src/components/window/libs/SystemState.ts
 * Need CodeReview 
 */
import { reactive } from "vue";
import {appconfig } from "../../appconfig";

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

class SystemState {
    private static instance: SystemState;
    state: stateCtrl;
    private constructor() {
        this.state = reactive({
            screen:"close",
            islock:false,
            lockEvent:{},
            unlockEvent:{}
        });
    }
    
    static getInstance() {
        if (this.instance == undefined) {
            this.instance = new SystemState()
        }
        return this.instance
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
        if(appconfig.start_time==0){
            this.state.screen='common'
        }else{
            this.state.screen='close'
        }

        setTimeout(()=>{
            this.state.screen='blue'
        },appconfig.start_time/2)
        setTimeout(()=>{
            this.state.screen='common'
        },appconfig.start_time)
    }
    restartPower(){
        // this.state.screen='blue'
        setTimeout(()=>{
            this.state.screen='blue'
        },2000)

        setTimeout(()=>{
            this.state.screen='close'
        },5000)

        setTimeout(()=>{
            window.location.reload()
        },6000)
    }
    lockScreen(){
        this.state.islock=true
        for(let key in this.state.lockEvent){
            this.state.lockEvent[key]()
        }
        
    }
    unlockScreen(username:string,password:string){
        this.state.islock=false;
        for(let key in this.state.unlockEvent){
            this.state.unlockEvent[key]({username,password})
        }
    }
    notifyUnlock(username:string,password:string){
        for(let key in this.state.unlockEvent){
            if(key !='hide'){
                this.state.unlockEvent[key]({username,password})
            }
        }
    }
}
export {
    SystemState
}