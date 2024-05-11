import { VtronFileWithoutContent } from '@/packages/kernel/file/FileSystem';
import { Notify } from '@/packages/services/notification/Notification';
import { SystemStateEnum } from '@/packages/type/enum';
import { Menu } from '@/packages/ui/menu/Menu';
import { BrowserWindow } from '@/packages/ui/window/BrowserWindow';
import { Tree } from '@/packages/util/Tree';
import { Setting, SystemOptions, WinAppOptions } from '@packages/type/type';

type OriginStateType = {
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
  windowMap: { [key: string]: Map<string, WinAppOptions> };
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

const stateOrigin: OriginStateType = {
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
};
