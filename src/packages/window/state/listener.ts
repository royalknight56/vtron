/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 18:42:40
 * @Description: 
 */
import { System } from '@libs/System'
import { initBatteryListener } from "@state/systemEvent/battery"
import { initResizeListener } from "@state/systemEvent/resize"
import { initIframeListener } from "@state/systemEvent/iframe"

function initListener(system: System) {
  initBatteryListener(system)
  initResizeListener(system)
  initIframeListener(system)
}
export {
  initListener
}
