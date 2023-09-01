import { BrowserWindow, BrowserWindowOption } from '../feature/window/BrowserWindow';
import { Tree } from '@packages/util/Tree';
import { SystemStateEnum } from './enum';
import { Notify } from '../feature/notification/Notification';
import { VtronFile } from '@feature/core/fileSystem';
import { VtronFileInterface } from '@feature/core/FIleInterface';
import { ShellInterface } from '@feature/core/ShellType';

export interface SystemOptions {
  lang?: string;
  logo?: string;
  background?: string;
  desktop?: WinAppOptions[];
  magnet?: WinAppOptions[];
  menulist?: WinAppOptions[];
  rootStyle?: any;
  fs?: VtronFileInterface;
  shell?: ShellInterface;
  noPassword?: boolean;
  loginCallback?: (username: string, password: string) => Promise<boolean>;
}
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
  ref: HTMLElement | undefined;
  system: {
    state: SystemStateEnum;
    message: {
      notify: Array<Notify>;
      system: Array<Notify>;
    };
    apps: Array<VtronFile>;
    magnet: Array<VtronFile>;
    menulist: Array<VtronFile>;
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
      screenWidth: number;
      screenHeight: number;
      battery: {
        isCharging: boolean;
        chargeLevel: number;
      };
      connection: number;
    };
    options: SystemOptions;
  };
};
