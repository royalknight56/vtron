/*
 * @Author: Royal
 * @LastEditTime: 2022-06-01 10:07:50
 * @Description: 启动时操作
 */
import { SystemState } from '@libs/SystemState';
import {initListener} from "@state/listener";

function globalInit() {
  SystemState.getInstance().openPower();
  initListener()
}
export {
  globalInit
}