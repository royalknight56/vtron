import { VtronFileWithoutContent } from '@/packages/kernel/file/FileSystem';
import { Notify } from '@/packages/services/notification/Notification';
import { Menu } from '@/packages/ui/menu/Menu';
import { BrowserWindow } from '@/packages/ui/window/BrowserWindow';
import { SystemStateEnum } from '@packages/type/enum';
import { Setting, SystemOptions } from '@packages/type/type';
import { Tree } from '@packages/util/Tree';
import { UnwrapNestedRefs, markRaw, reactive } from 'vue';
import { System } from '../system';
import { WindowMap } from './subStates/WindowMap';

export type OriginStateType = {
  systemState: SystemStateEnum;
  apps: Array<VtronFileWithoutContent>;
  magnet: Array<VtronFileWithoutContent>;
  menulist: Array<VtronFileWithoutContent>;
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
  options: SystemOptions;
  clipboard: any;
  settings: Array<Setting>;
  contextMenu: Menu | null;
  error: string;
};

const stateOrigin = {
  systemState: SystemStateEnum.close as SystemStateEnum,
  apps: [] as Array<VtronFileWithoutContent>,
  magnet: [] as Array<VtronFileWithoutContent>,
  menulist: [] as Array<VtronFileWithoutContent>,
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
  options: {} as SystemOptions,
  clipboard: {} as any,
  settings: [] as Setting[],
  contextMenu: null as Menu | null,
  error: '',
};

export class StateManager {
  state: UnwrapNestedRefs<OriginStateType>;
  system: System;
  windowMap = new WindowMap();

  constructor(system: System) {
    this.system = system;
    this.state = reactive<OriginStateType>(stateOrigin);
  }

  initRootState() {
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
    this.state.options = options;
  }

  getSystemState(): SystemStateEnum {
    return this.state.systemState;
  }
  setSystemState(systemState: SystemStateEnum): void {
    this.state.systemState = systemState;
  }

  pushSettings(setting: Setting): void {
    this.state.settings.push(setting);
  }

  setError(error: string): void {
    this.state.error = error;
  }
}
