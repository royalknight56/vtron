/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:20:39
 * @Description: 启动时操作
 */
// import { Power } from '@libs/Power';
import {initListener} from "@state/listener";
import {System} from '@libs/System'

function globalInit(system:System) {
  system.Power.openPower()
  initListener(system)
  if(system.SystemConfig.config.alert_before_unload){
    window.onbeforeunload = function(event){	
      return '确认离开吗？'; 
    }
  }
}
export {
  globalInit
}