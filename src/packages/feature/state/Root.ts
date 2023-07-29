import { SystemStateEnum } from '@packages/type/enum';
import { RootState, SystemOptions } from '@packages/type/type';
import { reactive, ref, UnwrapNestedRefs, watch, markRaw } from 'vue';
import { Tree } from '@packages/util/Tree';
import { BrowserWindow, BrowserWindowOption } from '../window/BrowserWindow';

const rootState: RootState = reactive({
  ref: undefined,
  system: {
    state: SystemStateEnum.close,
    apps: [],
    magnet: [],
    menulist: [],
    notify: [],
    windowTree: new Tree<BrowserWindow>(),
    windowOrder: Array<BrowserWindow>(),
    windowMap: {
      Desktop: new Map<string, BrowserWindowOption>(),
      Magnet: new Map<string, BrowserWindowOption>(),
      Menulist: new Map<string, BrowserWindowOption>(),
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
      connection: 0,
    },
    options: {},
  },
} as RootState) as unknown as RootState;
function initRootState(options: SystemOptions): RootState {
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
  rootState.system.options = options;
  return rootState;
}
function useRootState(): RootState {
  return rootState;
}
export { rootState, initRootState, useRootState };
