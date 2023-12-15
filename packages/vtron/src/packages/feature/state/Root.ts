import { SystemStateEnum } from '@packages/type/enum';
import { RootState, SystemOptions, WinAppOptions } from '@packages/type/type';
import { reactive, markRaw } from 'vue';
import { Tree } from '@packages/util/Tree';
import { BrowserWindow } from '../window/BrowserWindow';

function initRootState(options: SystemOptions): RootState {
  const rootState: RootState = reactive({
    ref: undefined,
    state: SystemStateEnum.close,
    apps: [],
    magnet: [],
    menulist: [],
    notify: [],
    message: {
      notify: [],
      system: [],
    },
    windowTree: new Tree<BrowserWindow>(),
    windowOrder: new Array<BrowserWindow>(),
    windowMap: {
      Desktop: new Map<string, WinAppOptions>(),
      Magnet: new Map<string, WinAppOptions>(),
      Menulist: new Map<string, WinAppOptions>(),
      Builtin: new Map<string, WinAppOptions>(),
    },
    topWindow: undefined,
    winnum: 0,
    info: {
      screenWidth: window?.innerWidth || 0,
      screenHeight: window?.innerHeight || 0,
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
    options: {},
    clipboard: {},
    settings: [],
    contextMenu: null,
    error: '',
  } as RootState) as unknown as RootState;
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
  rootState.options = options;
  return rootState;
}

export { initRootState };
