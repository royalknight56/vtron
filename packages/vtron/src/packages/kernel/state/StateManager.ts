import { Notify } from '@/packages/services/notification/Notification';
import { Menu } from '@/packages/ui/menu/Menu';
import { BrowserWindow } from '@/packages/ui/window/BrowserWindow';
import { SystemStateEnum } from '@packages/type/enum';
import { Tree } from '@packages/util/Tree';
import { UnwrapNestedRefs, markRaw, reactive } from 'vue';
import { System } from '../system';
import { AppListState } from './subStates/AppListState';
import { OptionsState } from './subStates/OptionsState';
import { SettingState } from './subStates/SettingState';
import { WindowMapState } from './subStates/WindowMapState';

export type OriginStateType = {
  systemState: SystemStateEnum;
  notify: Array<Notify>;
  message: {
    notify: Array<Notify>;
    system: Array<Notify>;
  };
  windowTree: Tree<BrowserWindow>;
  windowOrder: Array<BrowserWindow>;
  topWindow: BrowserWindow | undefined;
  winnum: number;
  info: {
    screenWidth: number;
    screenHeight: number;
    mouseX: number;
    mouseY: number;
    battery: {
      isCharging: boolean;
      chargeLevel: number;
    };
    brightness: number;
    connection: {
      effectiveType: string;
      rtt: number;
      downlink: number;
      saveData: boolean;
    };
  };
  clipboard: any;
  contextMenu: Menu | null;
  error: string;
};

const stateOrigin = {
  systemState: SystemStateEnum.close as SystemStateEnum,
  notify: [] as Array<Notify>,
  message: {
    notify: [] as Array<Notify>,
    system: [] as Array<Notify>,
  },
  windowTree: new Tree<BrowserWindow>(),
  windowOrder: new Array<BrowserWindow>(),
  topWindow: undefined as BrowserWindow | undefined,
  winnum: 0,
  info: {
    screenWidth: window?.innerWidth || 0,
    screenHeight: window?.innerHeight || 0,
    mouseX: 0,
    mouseY: 0,
    battery: {
      isCharging: false,
      chargeLevel: 0,
    },
    brightness: 50,
    connection: {
      effectiveType: '4g',
      rtt: 0,
      downlink: 0,
      saveData: false,
    },
  },
  clipboard: {} as any,
  contextMenu: null as Menu | null,
  error: '',
};

export class StateManager {
  state: UnwrapNestedRefs<OriginStateType>;
  system: System;
  windowMap = new WindowMapState();
  appList = new AppListState();
  settings = new SettingState();
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

  getSystemState(): SystemStateEnum {
    return this.state.systemState;
  }
  setSystemState(systemState: SystemStateEnum): void {
    this.state.systemState = systemState;
  }

  setError(error: string): void {
    this.state.error = error;
  }
}
