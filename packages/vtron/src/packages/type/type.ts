import { BrowserWindow, BrowserWindowOption } from '../feature/window/BrowserWindow';
import { Tree } from '@packages/util/Tree';
import { SystemStateEnum } from './enum';
import { Notify } from '../feature/notification/Notification';
import { VtronFileWithoutContent } from '@/packages/feature/core/FileSystem';
import { VtronFileInterface } from '@feature/core/FIleInterface';
import { ShellInterface } from '@feature/core/ShellType';
export type BuiltinApp = 'MyComputer' | 'AppStore';
export interface InitFileItem {
  type: string;
  name: string;
  children?: InitFileItem[];
  mode?: number;
  content?: string;
}
export interface Setting {
  key: string;
  title: string;
  desc: string;
  icon: string;
  content: any;
}
export type SafeAny = unknown;
export const Saveablekey: ('lang' | 'logo' | 'background' | 'rootStyle')[] = [
  'lang',
  'logo',
  'background',
  'rootStyle',
];
export type SystemOptionsSaveable = Pick<SystemOptionsCertainly, (typeof Saveablekey)[number]>;

export interface SystemOptionsCertainly {
  lang?: string;
  logo?: string;
  background?: string;
  rootStyle?: any;
  builtinApp?: BuiltinApp[];
  desktop?: WinAppOptions[];
  magnet?: WinAppOptions[];
  menulist?: WinAppOptions[];
  fs?: VtronFileInterface;
  userLocation?: string;
  systemLocation?: string;
  initFile?: InitFileItem;
  shell?: ShellInterface;
  login?: {
    username: string;
    password: string;
    init?: () => boolean;
  };
  noPassword?: boolean;
  loginCallback?: (username: string, password: string) => Promise<boolean>;
}
export type SystemOptions = SystemOptionsCertainly & {
  [key: string]: SafeAny;
};
export interface WinApp {
  icon: string;
  path: string;
}
export interface WinAppOptions {
  name: string;
  icon?: string;
  window: BrowserWindowOption;
}

export type RootState = {
  system: {
    ref: HTMLElement | undefined;
    state: SystemStateEnum;
    message: {
      notify: Array<Notify>;
      system: Array<Notify>;
    };
    apps: Array<VtronFileWithoutContent>;
    magnet: Array<VtronFileWithoutContent>;
    menulist: Array<VtronFileWithoutContent>;
    notify: Array<Notify>;
    windowTree: Tree<BrowserWindow>;
    windowOrder: Array<BrowserWindow>;
    windowMap: {
      Desktop: Map<string, BrowserWindowOption>;
      Magnet: Map<string, BrowserWindowOption>;
      Menulist: Map<string, BrowserWindowOption>;
      [key: string]: Map<string, BrowserWindowOption>;
    };
    winnum: number;
    topWindow: BrowserWindow | undefined;
    info: {
      // 系统次级信息
      screenWidth: number;
      screenHeight: number;
      brightness: number; // 亮度
      battery: {
        isCharging: boolean;
        chargeLevel: number;
      };
      connection: number;
    };
    clipboard: any;
    settings: Setting[];
    options: SystemOptions;
    error: string;
  };
};
