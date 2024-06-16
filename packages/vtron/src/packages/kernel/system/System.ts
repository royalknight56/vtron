import { Shell } from '@/packages/kernel/shell/Shell';
import { ShellInterface } from '@/packages/kernel/shell/ShellType';
import { PowerStateEnum } from '@/packages/kernel/state/subStates/PowerState';
import { FileSystemOperations } from '@/packages/kernel/system/fileSystemOperations/FileSystemOperations';
import {
  BrowserWindow,
  BrowserWindowOption,
  Dialog,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  Tray,
  TrayOptions,
} from '@/packages/services';
import { Notify, NotifyConstructorOptions } from '@/packages/services/notification/Notification';
import { Setting, SystemOptions, WinAppOptions } from '@packages/type/type';
import { markRaw } from 'vue';
import { version } from '../../../../package.json';
import { StateManager } from '../state/StateManager';
import { AppOperations } from './appOperations/AppOperations';
import { ConfigOperations } from './configOperations/ConfigOperations';
import { EventOperations } from './eventOperations/EventOperations';
import { FileOpenerOperations } from './fileOpenerOperations/FileOpenerOperations';
import { defaultConfig } from './initConfig';
import { PowerOperations } from './powerOperations/PowerOperations';

const logger = function (...args: any[]) {
  return;
  if (process.env.NODE_ENV !== 'development') return;
  console.log(...args);
};

export type VtronPlugin = (system: System) => void;

/**
 * @description: System 类，在初始化的过程中需要提供挂载点，以及一些配置
 */
export class System {
  public static GLOBAL_SYSTEM: System;
  public static GLOBAL_SYSTEM_ID: number = 0;
  id: number = System.GLOBAL_SYSTEM_ID++;

  readonly _options: SystemOptions;

  private _ready: ((value: System) => void) | null = null;
  private _error: ((reason: unknown) => void) | null = null;
  version = version;
  isFirstRun = true;
  rootRef: HTMLElement | undefined = undefined;

  get fs() {
    return this.fileSystemOperations.fs;
  }

  private fileSystemOperations: FileSystemOperations;
  private appOperations: AppOperations;
  private powerOperations: PowerOperations;
  private configOperations: ConfigOperations;
  private eventOperations: EventOperations;
  private fileOpenerOperations: FileOpenerOperations;

  stateManager: StateManager;

  constructor(options?: SystemOptions) {
    logger('initOptions');
    this._options = this.initOptions(options);

    this.fileSystemOperations = new FileSystemOperations(this);
    this.appOperations = new AppOperations(this);
    this.powerOperations = new PowerOperations(this);
    this.configOperations = new ConfigOperations(this);
    this.eventOperations = new EventOperations(this);
    this.fileOpenerOperations = new FileOpenerOperations(this);
    this.stateManager = new StateManager(this);

    if (this._options.unMount) {
      return;
    }
    this.mount();
  }

  mount() {
    logger('mountGlobalSystem');
    System.GLOBAL_SYSTEM = this; // 挂载全局系统
    BrowserWindow.system = this;
    Notify.system = this;
    Tray.system = this;
    Dialog.system = this;
    Menu.system = this;

    logger('initSystem');
    this.initSystem();

    logger('firstRun');
    this.firstRun();
  }
  activeCurrentSystem() {
    System.GLOBAL_SYSTEM = this;
  }

  /**
   * @description: pure 初始化配置选项
   */
  private initOptions(options?: SystemOptions) {
    const tempOptions = Object.assign({}, defaultConfig, options);
    return tempOptions;
  }

  /**
   * @description: 初始化系统
   */
  private async initSystem() {
    /**
     * 过程：激活屏幕，桥接事件。
     */
    this.stateManager.powerState.setPowerState(PowerStateEnum.opening);

    logger('initFileSystem');
    await this.fileSystemOperations.initFileSystem(); // 初始化文件系统
    logger('initSavedConfig');
    await this.configOperations.initSavedConfig(); // 初始化保存的配置
    logger('isLogin');
    this.powerOperations.init(); // 判断是否登录

    this.fs?.on('error', (err: string) => {
      this.emitError(err);
    });

    this._ready && this._ready(this);

    logger('start');
    this.emit('start');
  }

  replaceFileSystem: FileSystemOperations['replaceFileSystem'] = (fs) => {
    return this.fileSystemOperations.replaceFileSystem(fs);
  };
  mountVolume: FileSystemOperations['mountVolume'] = (path, fs) => {
    return this.fileSystemOperations.mountVolume(path, fs);
  };

  setConfig: ConfigOperations['setConfig'] = (key: string, value: any) => {
    return this.configOperations.setConfig(key, value);
  };
  getConfig: ConfigOperations['getConfig'] = (key: string) => {
    return this.configOperations.getConfig(key);
  };

  /**
   * @description: 添加应用
   * force 表示强制，在每次启动时都会添加
   */
  addApp: AppOperations['addApp'] = (options, force) => {
    return this.appOperations.addApp(options, force);
  };
  addMagnet: AppOperations['addMagnet'] = (options, force) => {
    return this.appOperations.addMagnet(options, force);
  };
  addMenuList: AppOperations['addMenuList'] = (options, force) => {
    return this.appOperations.addMenuList(options, force);
  };
  refershApp: AppOperations['refershApp'] = () => {
    return this.appOperations.refershApp();
  };

  addBuiltInApp(options: WinAppOptions) {
    this.stateManager.windowMap.set('Builtin', options.name, options);
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
    if (localStorage.getItem('vtronFirstRun' + this.id)) {
      this.isFirstRun = false;
      return false;
    } else {
      this.isFirstRun = true;
      localStorage.setItem('vtronFirstRun' + this.id, 'true');
      this.emit('firstRun');
      return true;
    }
  }

  shutdown: PowerOperations['shutdown'] = () => {
    return this.powerOperations.shutdown();
  };
  restart: PowerOperations['restart'] = () => {
    return this.powerOperations.restart();
  };
  recover: PowerOperations['recover'] = () => {
    return this.powerOperations.recover();
  };

  getEventer: EventOperations['getEventer'] = () => {
    return this.eventOperations.getEventer();
  };
  emit: EventOperations['emit'] = (event, ...args) => {
    return this.eventOperations.emit(event, ...args);
  };
  emitEvent: EventOperations['emitEvent'] = (event, ...args) => {
    return this.eventOperations.emitEvent(event, ...args);
  };
  on: EventOperations['on'] = (event, callback) => {
    return this.eventOperations.on(event, callback);
  };
  mountEvent: EventOperations['mountEvent'] = (event, callback) => {
    return this.eventOperations.mountEvent(event, callback);
  };

  offEvent: EventOperations['offEvent'] = (event, callback) => {
    return this.eventOperations.offEvent(event, callback);
  };

  /** 注册文件打开器 */
  registerFileOpener: FileOpenerOperations['registerFileOpener'] = (type, opener) => {
    return this.fileOpenerOperations.registerFileOpener(type, opener);
  };
  getOpener: FileOpenerOperations['getOpener'] = (type) => {
    return this.fileOpenerOperations.getOpener(type);
  };
  getAllFileOpener: FileOpenerOperations['getAllFileOpener'] = () => {
    return this.fileOpenerOperations.getAllFileOpener();
  };
  /**打开vtron 文件系统的文件 */
  openFile: FileOpenerOperations['openFile'] = (path) => {
    return this.fileOpenerOperations.openFile(path);
  };

  /** 注册设置app的设置页面 */
  registerSettingPanel(setting: Setting) {
    const temp = {
      ...setting,
      content: markRaw(setting.content),
    };
    this.stateManager.settings.pushSettings(temp);
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
    BrowserWindow.system = this;
    const win = new BrowserWindow(options);
    return win;
  }
  /** 方便的通过system创建notify */
  createNotify(options: NotifyConstructorOptions) {
    Notify.system = this;
    return new Notify(options);
  }
  /** 方便的通过system创建Dialog */
  createDialog() {
    Dialog.system = this;
    return Dialog;
  }
  /** 方便的通过system创建Tray */
  createTray(options: TrayOptions) {
    Tray.system = this;
    return new Tray(options);
  }

  /** 方便的通过system创建Menu */
  buildFromTemplate(options: Array<MenuItemConstructorOptions | MenuItem>) {
    Menu.system = this;
    return Menu.buildFromTemplate(options);
  }

  errorHandler = 0;
  emitError(error: string) {
    this._error && this._error(error);
    this.stateManager.error.setError(error);
    this.errorHandler = Date.now();
    setTimeout(() => {
      if (Date.now() - this.errorHandler > 1000 * 3) {
        this.stateManager.error.setError('');
      }
    }, 1000 * 4);
  }
}
