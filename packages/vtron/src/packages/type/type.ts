import { BrowserWindowOption, MenuItem, MenuItemConstructorOptions } from '@/packages/services';
import { VtronFileInterface } from '@packages/kernel/file/FIleInterface';
import { ShellInterface } from '@packages/kernel/shell/ShellType';
export type BuiltinFeature =
  | 'MyComputer'
  | 'DataTimeTray'
  | 'BatteryTray'
  | 'NetworkTray'
  | 'ImageOpener'
  | 'UrlOpener'
  | 'TextOpener'
  | 'ShortCutOpener'
  | 'ExeOpener'
  | 'Setting-Language'
  | 'Setting-Account'
  | 'Setting-Personalization';
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
  id?: number;
  /**
   * @description: 语言
   */
  lang?: string;
  /**
   * @description: logo
   */
  logo?: string;
  background?: string;
  rootStyle?: any;
  builtinFeature?: BuiltinFeature[];
  desktop?: WinAppOptions[];
  magnet?: WinAppOptions[];
  menulist?: WinAppOptions[];
  fs?: VtronFileInterface;
  userLocation?: string;
  systemLocation?: string;
  initFile?: InitFileItem;
  shell?: ShellInterface;
  brightness?: number;
  login?: {
    username: string;
    password: string;
    init?: () => boolean;
  };
  contextMenus?: Array<MenuItemConstructorOptions | MenuItem>;
  noPassword?: boolean;
  loginCallback?: (username: string, password: string) => Promise<boolean>;
  /**
   * 不立即挂载系统，默认为false
   */
  unMount?: boolean;
}
export type SystemOptions = SystemOptionsCertainly & {
  [key: string]: SafeAny;
};
export interface WinAppOptionsGroup {
  type: 'group';
  name: string;
  /** 是否可以同时打开多个 */
  multiple?: boolean;
  /** 排列的顺序 */
  order?: number;
  group: WinAppOptions[];
  /** @internal 是否已经显示 */
  _hasShow?: boolean;
}

export interface WinAppOptionsApp {
  type?: 'app';
  name: string;
  icon?: string;
  /** 是否可以同时打开多个 */
  multiple?: boolean;
  /** 排列的顺序 */
  order?: number;
  /** 窗口配置 */
  window: BrowserWindowOption;
  /** @internal 是否已经显示 */
  _hasShow?: boolean;
}

export type WinAppOptions = WinAppOptionsGroup | WinAppOptionsApp;
