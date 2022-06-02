/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-06-01 11:44:57
 * @Description: 
 */
import {sysInfo} from "@state/index";
function init(){
  let nav = navigator as any
  let connection = nav.connection as any;
  sysInfo.connection = connection.rtt
  connection.addEventListener("change", ()=>{
    sysInfo.connection = connection.rtt
  });
  
  nav.getBattery().then((battery:any) => {
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
  init
}
