/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 18:42:40
 * @Description: 
 */
// import {sysInfo} from "@state/index";

import {System} from '@libs/System'


function initListener(system:System){
  let sysInfo = system.State.sysInfo
  let nav = navigator as any
  let connection = nav.connection as any;
  sysInfo.connection = connection.rtt
  connection.addEventListener("change", ()=>{
    sysInfo.connection = connection.rtt
  });
  nav.getBattery?.().then((battery:any) => {
    sysInfo.isCharging = battery.charging
    sysInfo.chargeLevel = battery.level
    battery.onchargingchange = () => {
      sysInfo.isCharging = battery.charging
      sysInfo.chargeLevel = battery.level
    }
 }).catch(()=>{
    sysInfo.isCharging = false
    sysInfo.chargeLevel = 0
 });
}
export {
  initListener
}
