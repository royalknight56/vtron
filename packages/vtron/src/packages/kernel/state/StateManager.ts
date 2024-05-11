import { Notify } from '@/packages/services/notification/Notification';
import { Menu } from '@/packages/ui/menu/Menu';
import { BrowserWindow } from '@/packages/ui/window/BrowserWindow';
import { UnwrapNestedRefs, markRaw, reactive } from 'vue';
import { System } from '../system';
import { AppListState } from './subStates/AppListState';
import { OptionsState } from './subStates/OptionsState';
import { PowerState } from './subStates/PowerState';
import { SettingState } from './subStates/SettingState';
import { WindowMapState } from './subStates/WindowMapState';
import { WindowTreeState } from './subStates/WindowTreeState';
import { NotifyState } from './subStates/NotifyState';
import { NavigatorState } from './subStates/NavigatorState';

export type OriginStateType = {
  info: {
    screenWidth: number;
    screenHeight: number;
    mouseX: number;
    mouseY: number;
    brightness: number;
  };
  clipboard: any;
  contextMenu: Menu | null;
  error: string;
};

const stateOrigin = {
  info: {
    screenWidth: window?.innerWidth || 0,
    screenHeight: window?.innerHeight || 0,
    mouseX: 0,
    mouseY: 0,
    brightness: 50,
  },
  clipboard: {} as any,
  contextMenu: null as Menu | null,
  error: '',
};

export class StateManager {
  private system: System;
  state: UnwrapNestedRefs<OriginStateType>;
  windowMap = new WindowMapState();
  appList = new AppListState();
  settings = new SettingState();
  powerState = new PowerState();
  windowTree = new WindowTreeState();
  notify = new NotifyState();
  navigator = new NavigatorState();

  options: OptionsState;

  constructor(system: System) {
    this.system = system;
    this.state = reactive<OriginStateType>(stateOrigin);

    const options = this.system._options;
    options.desktop?.forEach((item) => {
      if (typeof item.window.content !== 'string') {
        item.window.content = markRaw(item.window.content);
      }
    });
    options.magnet?.forEach((item) => {
      if (typeof item.window.content !== 'string') {
        item.window.content = markRaw(item.window.content);
      }
    });
    options.menulist?.forEach((item) => {
      if (typeof item.window.content !== 'string') {
        item.window.content = markRaw(item.window.content);
      }
    });
    this.options = new OptionsState(options);
  }

  setError(error: string): void {
    this.state.error = error;
  }
}
