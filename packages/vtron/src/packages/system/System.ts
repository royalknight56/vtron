import { Eventer, initEventer, initEventListener } from '@/packages/kernel/event';
import { VtronFileInterface } from '@/packages/kernel/file/FIleInterface';
import { VtronFileSystem } from '@/packages/kernel/file/FileSystem';
import { extname, join } from '@/packages/kernel/file/Path';
import { Shell } from '@/packages/kernel/shell/Shell';
import { ShellInterface } from '@/packages/kernel/shell/ShellType';
import { initRootState, RootState } from '@/packages/kernel/state/Root';
import { systemStartup } from '@/packages/startup';
import { Dialog } from '@/packages/ui/dialog/Dialog';
import { Notify, NotifyConstructorOptions } from '@/packages/ui/notification/Notification';
import { Tray, TrayOptions } from '@/packages/ui/tray/Tary';
import { pick } from '@/packages/util/modash';
import { SystemStateEnum } from '@packages/type/enum';
import {
  Saveablekey,
  Setting,
  SystemOptions,
  SystemOptionsCertainly,
  WinAppOptions,
} from '@packages/type/type';
import { BrowserWindow, BrowserWindowOption } from '@packages/ui/window/BrowserWindow';
import { markRaw, nextTick } from 'vue';
import { version } from '../../../package.json';
import { defaultConfig } from './initConfig';

const logger = function (...args: any[]) {
  return;
  if (process.env.NODE_ENV !== 'development') return;
  console.log(...args);
};

export type VtronPlugin = (system: System) => void;
export type FileOpener = {
  name?: string;
  icon: string;
  hiddenInChosen?: boolean;
  func: (path: string, content: string) => void;
};
export class Bios {
  public static _onOpen: ((system: System) => void) | null = null;
  public static onOpen(func: (system: System) => void) {
    this._onOpen = func;
  }
  constructor() {
    //
  }
}

/**
 * @description: System 类，在初始化的过程中需要提供挂载点，以及一些配置
 */
export class System {
  public static GLOBAL_SYSTEM: System;

  readonly _options: SystemOptions;

  _rootState: RootState;
  private _eventer: Eventer;
  private _ready: ((value: System) => void) | null = null;
  private _error: ((reason: unknown) => void) | null = null;
  private _flieOpenerMap: Map<string, FileOpener> = new Map();
  version = version;
  isFirstRun = true;
  rootRef: HTMLElement | undefined = undefined;
  fs!: VtronFileInterface;
  _shell!: ShellInterface;

  constructor(options?: SystemOptions) {
    logger('initOptions');
    this._options = this.initOptions(options);
    logger('initRootState');
    this._rootState = this.initRootState();
    logger('mountGlobalSystem');
    System.GLOBAL_SYSTEM = this; // 挂载全局系统
    Bios._onOpen && Bios._onOpen(this);
    logger('initEvent');
    this._eventer = this.initEvent();
    logger('initSystem');
    this.initSystem();
    logger('firstRun');
    this.firstRun();
  }

  /**
   * @description: pure 初始化配置选项
   */
  private initOptions(options?: SystemOptions) {
    const tempOptions = Object.assign({}, defaultConfig, options);
    return tempOptions;
  }
  /**
   * @description: 获取系统配置
   */
  private initRootState(): RootState {
    return initRootState(this._options);
  }
  /**
   * @description: 初始化系统
   */
  private async initSystem() {
    /**
     * 过程：激活屏幕，桥接事件。
     */
    this._rootState.state = SystemStateEnum.opening;

    logger('initFileSystem');
    await this.initFileSystem(); // 初始化文件系统
    logger('initSavedConfig');
    await this.initSavedConfig(); // 初始化保存的配置
    logger('initShell');
    await this.initShell(); // 初始化shell
    logger('initApp');
    this.initApp(); // 初始化配置应用到app文件夹中
    logger('initAppList');
    this.initAppList(); // 刷新app文件夹，展示应用
    logger('isLogin');
    this.isLogin(); // 判断是否登录
    logger('initEventListener');
    initEventListener(); // 初始化事件侦听
    this._ready && this._ready(this);
    logger('runPlugin');
    this.runPlugin(this); // 运行fs中插件

    systemStartup(this); // 系统应用启动

    logger('start');
    this.emit('start');
  }
  /**
   * @description: 判断是否登录
   */
  private isLogin() {
    if (!this._options.login) {
      this._rootState.state = SystemStateEnum.open;
      return;
    } else {
      if (this._options.login.init?.()) {
        this._rootState.state = SystemStateEnum.open;
        return;
      }

      this._rootState.state = SystemStateEnum.lock;
      const tempCallBack = this._options.loginCallback;
      if (!tempCallBack) {
        throw new Error('没有设置登录回调函数');
      }
      this._options.loginCallback = async (username: string, password: string) => {
        const res = await tempCallBack(username, password);
        if (res) {
          this._rootState.state = SystemStateEnum.open;
          return true;
        }
        return false;
      };
    }
  }

  /**
   * @description: 初始化事件系统
   */
  private initEvent() {
    /**
     * 过程：监听事件，处理事件
     */
    return initEventer();
  }
  private initApp() {
    this._rootState.options.desktop?.forEach((item) => {
      this.addApp(item);
    });
    this._rootState.options.magnet?.forEach((item) => {
      this.addMagnet(item);
    });
    this._rootState.options.menulist?.forEach((item) => {
      this.addMenuList(item);
    });
  }

  private refershAppList() {
    const APP_TYPE = ['apps', 'magnet', 'menulist'];
    const system = useSystem();
    for (let i = 0; i < APP_TYPE.length; i++) {
      const element = APP_TYPE[i];
      system?.fs
        .readdir(
          `${system._options.userLocation}${
            {
              apps: 'Desktop',
              magnet: 'Magnet',
              menulist: 'Menulist',
            }[element]
          }`
        )
        .then((res) => {
          if (res) {
            const list = res;
            const tempList = [];
            for (let j = 0; j < list.length; j++) {
              const item = list[j];

              tempList.push(item);
            }

            switch (element) {
              case 'apps':
                useSystem()._rootState.apps.splice(0, useSystem()._rootState.apps.length, ...tempList);
                break;
              case 'magnet':
                useSystem()._rootState.magnet.splice(0, useSystem()._rootState.magnet.length, ...tempList);
                break;
              case 'menulist':
                useSystem()._rootState.menulist.splice(
                  0,
                  useSystem()._rootState.menulist.length,
                  ...tempList
                );
                break;
              default:
                break;
            }
          }
        });
    }
  }

  isReadyUpdateAppList = false;
  initAppList() {
    this.isReadyUpdateAppList = true;
    nextTick(() => {
      if (this.isReadyUpdateAppList) {
        this.isReadyUpdateAppList = false;
        this.refershAppList();
      }
    });
  }

  private async initFileSystem() {
    // 如果传入了自定义fs，就使用传入的fs
    if (this._options.fs) {
      this.fs = this._options.fs;
    } else {
      this.fs = await new VtronFileSystem().initFileSystem(this._options);
      (this.fs as VtronFileSystem).on('error', (err: string) => {
        this.emitError(err);
      });
      this.fs.registerWatcher(new RegExp(`^${this._options.userLocation}`), () => {
        this.initAppList();
      });
    }
  }
  replaceFileSystem(fs: VtronFileInterface) {
    this.fs = fs;
    this.initAppList();
  }
  mountVolume(path: string, fs: VtronFileInterface) {
    if (this.fs instanceof VtronFileSystem) {
      this.fs.mountVolume(path, fs);
    } else {
      console.error('自定义文件系统不支持挂载卷');
    }
  }
  private async initShell() {
    if (this._options.shell) {
      this._shell = this._options.shell;
    } else {
      this._shell = new Shell(this, '/', 'root');
    }
  }

  /**
   * @description: 初始化保存的配置
   */
  private async initSavedConfig() {
    const config = await this.fs.readFile(join(this._options.systemLocation || '', 'Vtron/config.json'));
    if (config) {
      try {
        this._rootState.options = Object.assign(this._rootState.options, JSON.parse(config));
      } catch {
        new Notify({
          title: 'Vtron',
          content: '配置文件格式错误',
        });
      }
    }
  }
  setConfig<T extends keyof SystemOptionsCertainly>(key: T, value: SystemOptionsCertainly[T]): Promise<void>;
  setConfig<T extends string>(
    key: T,
    value: T extends keyof SystemOptionsCertainly ? SystemOptionsCertainly[T] : unknown
  ): Promise<void>;
  setConfig<T extends keyof SystemOptionsCertainly>(key: string, value: SystemOptionsCertainly[T]) {
    this._rootState.options[key] = value;
    if (Saveablekey.includes(key as any)) {
      return this.fs.writeFile(
        join(this._options.systemLocation || '', 'Vtron/config.json'),

        JSON.stringify(pick(this._rootState.options, ...Saveablekey))
      );
    } else {
      return Promise.resolve();
    }
  }

  getConfig<T extends keyof SystemOptionsCertainly>(key: T): SystemOptionsCertainly[T];
  getConfig<T extends string>(key: T): unknown;
  getConfig(key: string) {
    return this._rootState.options[key];
  }

  private addWindowSysLink(loc: string, options: WinAppOptions, force = false) {
    if (this.isFirstRun || force) {
      this.fs.writeFile(
        `${this._options.userLocation}${loc}/` + options.name + '.exe',
        `link::${loc}::${options.name}::${options.icon}`
      );
    } else {
      this.initAppList();
    }
    if (typeof options.window.content === 'string') {
      // TODO: 当content是string的时候
    } else {
      options.window.content = markRaw(options.window.content);
    }
    this._rootState.windowMap[loc].set(options.name, options);
  }

  async runPlugin(system: System) {
    const pluginsFile = await this.fs.readdir(`${this._options.systemLocation}plugs`);
    if (pluginsFile) {
      await Promise.all(
        pluginsFile.map(async (file) => {
          const fileContent = await this.fs.readFile(file.path);
          if (file.isFile) {
            const content = fileContent;
            if (content) {
              new Shell(system, '/', 'root').exec('node ' + file.path);
            }
          }
        })
      );
    }
  }
  /**
   * @description: 添加应用
   * force 表示强制，在每次启动时都会添加
   */
  addApp(options: WinAppOptions, force = false) {
    this.addWindowSysLink('Desktop', options, force);
  }
  addMagnet(options: WinAppOptions, force = false) {
    this.addWindowSysLink('Magnet', options, force);
  }
  addMenuList(options: WinAppOptions, force = false) {
    this.addWindowSysLink('Menulist', options, force);
  }
  addBuiltInApp(options: WinAppOptions) {
    this._rootState.windowMap['Builtin'].set(options.name, options);
  }

  createShell(): ShellInterface {
    if (this._options.shell) {
      return this._options.shell;
    } else {
      return new Shell(this, '/', 'root');
    }
  }
  async shell(cmd: string) {
    const shello = this.createShell();
    const cmdArr = cmd.split('\n');
    for (let i = 0; i < cmdArr.length; i++) {
      await shello.exec(cmdArr[i]);
    }
  }
  whenReady(): Promise<System> {
    return new Promise<System>((resolve, reject) => {
      this._ready = resolve;
      this._error = reject;
    });
  }
  firstRun() {
    if (localStorage.getItem('vtronFirstRun')) {
      this.isFirstRun = false;
      return false;
    } else {
      this.isFirstRun = true;
      localStorage.setItem('vtronFirstRun', 'true');
      this.emit('firstRun');
      return true;
    }
  }
  shutdown() {
    this._rootState.state = SystemStateEnum.close;
  }
  reboot() {
    this._rootState.state = SystemStateEnum.close;
    window.location.reload();
  }
  recover() {
    this.fs.removeFileSystem();
    localStorage.removeItem('vtronFirstRun');
    localStorage.removeItem('vtron-username');
    localStorage.removeItem('vtron-password');
    localStorage.removeItem('vtronCommandHistory');

    this._rootState.state = SystemStateEnum.close;
    window.location.reload();
  }
  getEventer() {
    return this._eventer;
  }
  emit(event: string, ...args: any[]) {
    this.emitEvent(event, ...args);
  }
  emitEvent(event: string, ...args: any[]) {
    const eventArray = event.split('.');
    eventArray.forEach((item, index) => {
      const tempEvent = eventArray.slice(0, index + 1).join('.');
      this._eventer.emit(tempEvent, event, args);
    });
    this._eventer.emit('system', event, args);
  }
  on(event: string, callback: (...args: any[]) => void): void {
    this.mountEvent(event, callback);
  }
  mountEvent(event: string | string[], callback: (...args: any[]) => void) {
    if (Array.isArray(event)) {
      event.forEach((item) => {
        this.mountEvent(item, callback);
      });
      return;
    } else {
      this._eventer.on(event, callback);
    }
  }

  offEvent(event?: string, callback?: (...args: any[]) => void): void {
    this._eventer.off(event, callback);
  }

  /** 注册文件打开器 */
  registerFileOpener(type: string | string[], opener: FileOpener) {
    if (Array.isArray(type)) {
      type.forEach((item) => {
        this._flieOpenerMap.set(item, opener);
      });
      return;
    }
    this._flieOpenerMap.set(type, opener);
  }
  getOpener(type: string) {
    return this._flieOpenerMap.get(type);
  }
  getAllFileOpener() {
    return this._flieOpenerMap;
  }

  /** 注册设置app的设置页面 */
  registerSettingPanel(setting: Setting) {
    const temp = {
      ...setting,
      content: markRaw(setting.content),
    };
    this._rootState.settings?.push(temp);
  }
  /**打开vtron 文件系统的文件 */
  async openFile(path: string) {
    const fileStat = await this.fs.stat(path);
    if (!fileStat) {
      throw new Error('文件不存在');
    }
    if (fileStat?.isDirectory) {
      this._flieOpenerMap.get('dir')?.func.call(this, path, '');
      return;
    } else {
      const fileContent = await this.fs.readFile(path);
      this._flieOpenerMap
        .get(extname(fileStat?.path || '') || 'link')
        ?.func.call(this, path, fileContent || '');
    }
  }
  // 插件系统
  use(func: VtronPlugin): void {
    return func(this);
  }
  // 状态序列化和反序列化
  async serializeState(): Promise<string> {
    const serializeFile = await this.fs.serializeFileSystem();
    return JSON.stringify(serializeFile);
  }
  deserializeState(state: string) {
    this.fs.deserializeFileSystem(JSON.parse(state));
  }

  outerFileDropCallback:
    | ((path: string, list: FileList | undefined, process: (path: string) => void) => void)
    | null = null;
  // 当从外部拖入文件时
  onOuterFileDrop(func: (path: string, list: FileList | undefined, process: (path: string) => void) => void) {
    this.outerFileDropCallback = func;
  }
  /** 方便的通过system创建window */
  createWindow(options: BrowserWindowOption) {
    const win = new BrowserWindow(options);
    return win;
  }
  /** 方便的通过system创建notify */
  createNotify(options: NotifyConstructorOptions) {
    return new Notify(options);
  }
  /** 方便的通过system创建Dialog */
  createDialog() {
    return Dialog;
  }
  /** 方便的通过system创建Tray */
  createTray(options: TrayOptions) {
    return new Tray(options);
  }

  errorHandler = 0;
  emitError(error: string) {
    this._error && this._error(error);
    this._rootState.error = error;
    this.errorHandler = Date.now();
    setTimeout(() => {
      if (Date.now() - this.errorHandler > 1000 * 3) {
        this._rootState.error = '';
      }
    }, 1000 * 4);
  }
}
export function useSystem() {
  return System.GLOBAL_SYSTEM!;
}
