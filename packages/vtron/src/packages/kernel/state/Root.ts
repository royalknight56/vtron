import { VtronFileWithoutContent } from '@/packages/kernel/file/FileSystem';
import { Menu } from '@/packages/ui/menu/Menu';
import { Notify } from '@/packages/ui/notification/Notification';
import { BrowserWindow } from '@/packages/ui/window/BrowserWindow';
import { SystemStateEnum } from '@packages/type/enum';
import { Setting, SystemOptions, WinAppOptions } from '@packages/type/type';
import { Tree } from '@packages/util/Tree';
import { markRaw, reactive } from 'vue';
export type RootState = ReturnType<typeof initRootState>;

function initRootState(options: SystemOptions) {
  const rootState = reactive({
    ref: undefined,
    state: SystemStateEnum.close as SystemStateEnum,
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
    windowMap: {
      Desktop: new Map<string, WinAppOptions>(),
      Magnet: new Map<string, WinAppOptions>(),
      Menulist: new Map<string, WinAppOptions>(),
      Builtin: new Map<string, WinAppOptions>(),
    } as {
      [key: string]: Map<string, WinAppOptions>;
    },
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
  });
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
