import { initRootState } from '@feature/state/Root';
import { SystemStateEnum } from '@packages/type/enum';
import { markRaw } from 'vue';
import {
  RootState,
  Saveablekey,
  Setting,
  SystemOptions,
  SystemOptionsCertainly,
  WinAppOptions,
} from '@packages/type/type';
import { initEventer, Eventer, initEventListener, emitEvent, mountEvent } from '@feature/event';
import { VtronFileSystem } from '@/packages/feature/core/FileSystem';
import { initAppList } from '@packages/hook/useAppOpen';

import { version } from '../../../../package.json';
import { BrowserWindow, BrowserWindowOption } from '@feature/window/BrowserWindow';

import { extname, join } from '@feature/core/Path';
import { initBuiltinApp, initBuiltinFileOpener } from './initBuiltin';
import { Shell } from '@feature/core/Shell';
import { defaultConfig } from './initConfig';
import { VtronFileInterface } from '@feature/core/FIleInterface';
import { InitSystemFile, InitUserFile } from '@/packages/feature/system/SystemFileConfig';
import { createInitFile } from './createInitFile';
import { Notify, NotifyConstructorOptions } from '@feature/notification/Notification';
import { ShellInterface } from '@feature/core/ShellType';
import { Dialog } from '../dialog/Dialog';
import { pick } from '@/packages/util/modash';
import { Tray, TrayOptions } from '@feature/tray/Tary';

const logger = function (...args: any[]) {
  return;
  if (process.env.NODE_ENV !== 'development') return;
  console.log(...args);
};

export type VtronPlugin = (system: System, rootState: RootState) => void;
export type FileOpener = {
  name?: string;
  icon: string;
  hiddenInChosen?: boolean;
  func: (path: string, content: string) => void;
};
/**
 * @description: System 类，在初始化的过程中需要提供挂载点，以及一些配置
 */
class System {
  public static GLOBAL_SYSTEM: System;
  public static _onOpen: ((system: System) => void) | null = null;
  public static onOpen(func: (system: System) => void) {
    System._onOpen = func;
  }
  readonly _options: SystemOptions;
  /**
   * @internal
   */
  _rootState: RootState;
  private _eventer: Eventer;
  private _ready: ((value: System) => void) | null = null;
  private _error: ((reason: unknown) => void) | null = null;
  private _readyToUpdata = false;
  private _flieOpenerMap: Map<string, FileOpener> = new Map();
  version = version;
  isFirstRun = true;
  ref!: HTMLElement;
  fs!: VtronFileInterface;
  _shell!: ShellInterface;

  constructor(options?: SystemOptions) {
    logger('initOptions');
    this._options = this.initOptions(options);
    logger('initRootState');
    this._rootState = this.initRootState();
    logger('mountGlobalSystem');
    System.GLOBAL_SYSTEM = this; // 挂载全局系统
    System._onOpen && System._onOpen(this);
    logger('initEvent');
    this._eventer = this.initEvent();
    logger('initSystem');
    this.initSystem();
    logger('firstRun');
    this.firstRun();
    logger('setRef');
    this.setRef(this._rootState.ref!);
  }

  setRef(ref: HTMLElement) {
    this.ref = ref;
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
    logger('initBuiltinFileOpener');
    initBuiltinFileOpener(this); // 注册内建文件打开器
    logger('initFileSystem');
    await this.initFileSystem(); // 初始化文件系统
    logger('initSavedConfig');
    await this.initSavedConfig(); // 初始化保存的配置
    logger('initShell');
    await this.initShell(); // 初始化shell
    logger('initBuiltinApp');
    initBuiltinApp(this); // 初始化内建应用
    logger('initApp');
    this.initApp(); // 初始化配置应用到app文件夹中
    logger('initAppList');
    initAppList(); // 刷新app文件夹，展示应用
    logger('isLogin');
    // 判断是否登录
    this.isLogin();
    logger('_ready');
    logger('initEventListener');
    initEventListener(); // 初始化事件侦听

    this._ready && this._ready(this);
    logger('runPlugin');
    this.runPlugin(this); // 运行fs中插件
    logger('initBackground');
    this.initBackground(); // 初始化壁纸
    logger('initEvent');
    this.initCheckVersion(); // 检查版本
    logger('initEvent');
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
   * @description: 初始化壁纸
   */
  private async initBackground() {
    const back = await this.fs.readFile(`${this._options.systemLocation}Vtron/background.txt`);
    if (back) {
      this._rootState.options.background = back;
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
  private async initFileSystem() {
    // 如果传入了自定义fs，就使用传入的fs
    if (this._options.fs) {
      this.fs = this._options.fs;
    } else {
      logger(this.fs);
      this.fs = await new VtronFileSystem().initFileSystem();
      (this.fs as VtronFileSystem).on('error', (err: string) => {
        this.emitError(err);
      });
      logger(this.fs);
      await this.fs.mkdir('/C');
      await this.fs.chmod('/C', 0o111);
      await createInitFile(this, this._options.initFile || InitUserFile, this._options.userLocation);
      await createInitFile(this, this._options.initFile || InitSystemFile, this._options.systemLocation);
      this.fs.registerWatcher(new RegExp(`^${this._options.userLocation}`), () => {
        initAppList();
      });
    }
  }
  replaceFileSystem(fs: VtronFileInterface) {
    this.fs = fs;
    initAppList();
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
   * @description: 检查版本
   * @return {*}
   */
  private async initCheckVersion() {
    const programVersion = this.version;
    const systemVersion = await this.fs.readFile(
      join(this._options.systemLocation || '', 'Vtron/version.txt')
    );
    if (systemVersion && programVersion) {
      if (programVersion !== systemVersion) {
        this.createNotify({
          title: 'Vtron',
          content: '本地程序和文件版本不一致，请恢复出厂设置',
        });
      }
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
      initAppList();
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
    this._rootState.state = SystemStateEnum.close;
    window.location.reload();
  }
  emit(event: string, ...args: any[]) {
    this.emitEvent(event, ...args);
  }
  emitEvent(event: string, ...args: any[]) {
    emitEvent(event, ...args);
  }
  on(event: string, callback: (...args: any[]) => void): void {
    this.mountEvent(event, callback);
  }
  mountEvent(event: string, callback: (...args: any[]) => void) {
    mountEvent(event, callback);
  }
  registerFileOpener(type: string | string[], opener: FileOpener) {
    if (Array.isArray(type)) {
      type.forEach((item) => {
        this._flieOpenerMap.set(item, opener);
      });
      return;
    }
    this._flieOpenerMap.set(type, opener);
  }
  getAllFileOpener() {
    return this._flieOpenerMap;
  }
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
  getOpener(type: string) {
    return this._flieOpenerMap.get(type);
  }
  // 插件系统
  use(func: VtronPlugin): void {
    return func(this, this._rootState);
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
function useSystem() {
  return System.GLOBAL_SYSTEM!;
}
export { System, useSystem };
