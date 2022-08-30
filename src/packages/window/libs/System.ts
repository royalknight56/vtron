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
import { SystemConfig,OptionType,partialOption } from "@/packages/window/libs/SystemConfig";

class System {
  id:string;
  SystemConfig:SystemConfig;
  Power: Power;
  Notify: Notify;
  ContextMenu: ContextMenu;
  private DWM: DWM;
  getWindow:DWM["getWindow"]
  State: State;
  DragWindow:ReturnType<typeof DragWindowFactory>
  constructor(option:partialOption) {
    // generate id
    this.id='win10'+Math.random().toString(36).substr(2, 9);
    // init Config
    this.SystemConfig=new SystemConfig(this)
    this.SystemConfig.initConfig(option)
    // register system
    this.Power =new Power(this);
    this.Notify = new Notify(this);
    this.ContextMenu =new ContextMenu(this);
    this.DWM = new DWM(this);
    this.getWindow = this.DWM.getWindow.bind(this.DWM);
    ({...this.State} = stateInit());
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