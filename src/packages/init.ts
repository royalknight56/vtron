/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 18:43:16
 * @Description: 启动时操作
 */
import { SystemState } from '@libs/SystemState';
import {initListener} from "@state/listener";
import {System} from '@libs/System'

function globalInit(system:System) {
  SystemState.getInstance().openPower();
  initListener(system)
}
export {
  globalInit
}