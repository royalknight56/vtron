/*
 * @Author: RoyalKnight
 * @LastEditTime: 2022-07-14 19:54:50
 * @Description: 
 */
import { Power } from "@libs/Power";
import { Notify } from "@libs/Notify";
import { ContextMenu } from "@libs/ContextMenu";
import { DWM } from "@libs/DWM"
import {
  State,
  stateInit
} from "@state/index";
import type {appInfo} from "@state/type";
import {DragWindowFactory} from "@libs/DragWindow"
import { defaultOption } from '@libs/option'

class System {
  id:string;
  Power: Power;
  Notify: Notify;
  ContextMenu: ContextMenu;
  DWM: DWM;
  State: State
  DragWindow:ReturnType<typeof DragWindowFactory>
  constructor() {
    this.id='win10'+Math.random().toString(36).substr(2, 9);
    this.Power =new Power(this);
    this.Notify = new Notify(this);
    this.ContextMenu =new ContextMenu(this);
    this.DWM = new DWM(this);
    
    ({...this.State} = stateInit())

    this.DragWindow=DragWindowFactory(this)
  }
  ClearDesktop() {
    this.State.appList.splice(0, this.State.appList.length)
  }
  AddToDesktop(app:appInfo) {
    this.State.appList.push(Object.assign({
      name: defaultOption.untitle,
      icon: defaultOption.icon,
    }, app))
  }
}
export { System };