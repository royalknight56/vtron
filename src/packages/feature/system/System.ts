import { initRootState } from '@feature/state/Root';
import { SystemStateEnum } from '@packages/type/enum';
import { markRaw } from 'vue';
import { RootState, SystemOptions, WinAppOptions } from '@packages/type/type';
import { initEventer, Eventer, initEventListener, emitEvent, mountEvent } from '@feature/event';
import { VtronFileSystem } from '@feature/core/fileSystem';
import { initAppList } from '@packages/hook/useAppOpen';

import { version } from '../../../../package.json';
import { BrowserWindow } from '@feature/window/BrowserWindow';

import { extname } from '@feature/core/Path';
import { initBuiltinApp, initBuiltinFileOpener } from './initBuiltin';
import { Shell } from '@feature/core/Shell';
import { defaultConfig } from './initConfig';
import { VtronFileInterface } from '@feature/core/FIleInterface';
import { InitFile } from '@feature/core/SystemFileConfig';
import { createInitFile } from './createInitFile';
import { Notify } from '@feature/notification/Notification';
import { ShellInterface } from '@feature/core/ShellType';
let GLOBAL_SYSTEM: System | null = null;

export type VtronPlugin = (system: System, rootState: RootState) => void;
export type FileOpener = {
  icon: string;
  func: (path: string, content: string) => void;
};
/**
 * @description: System 类，在初始化的过程中需要提供挂载点，以及一些配置
 */
class System {
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
    this.mountGlobalSystem(this); // 挂载全局系统

    this._options = this.initOptions(options);
    this._rootState = this.initRootState();
    this._eventer = this.initEvent();

    this.initSystem();
    this.firstRun();
    this.setRef(this._rootState.ref!);
  }
  mountGlobalSystem(system: System) {
    GLOBAL_SYSTEM = system;
  }

  setRef(ref: HTMLElement) {
    this.ref = ref;
    if (this._options.rootStyle) {
      this.setRootStyle(this._options.rootStyle);
    }
  }
  setRootStyle(obj: any) {
    if (obj) {
      Object.keys(obj).forEach((key) => {
        this.ref.style.setProperty(key, obj[key]);
      });
    }
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
    this._rootState.system.state = SystemStateEnum.opening;
    initEventListener(); // 初始化事件侦听
    initBuiltinFileOpener(this); // 注册内建文件打开器
    await this.initFileSystem(); // 初始化文件系统
    await this.initShell(); // 初始化shell
    initBuiltinApp(this); // 初始化内建应用
    this.initApp(); // 初始化配置应用到app文件夹中
    initAppList(); // 刷新app文件夹，展示应用

    // 判断是否登录
    this.isLogin();
    // this._rootState.system.state = SystemStateEnum.open;
    this._ready && this._ready(this);

    this.runPlugin(this); // 运行fs中插件
    this.initBackground(); // 初始化壁纸
    await this.initSavedConfig(); // 初始化保存的配置

    this.setRootStyle(this._rootState.system.options.rootStyle); // 设置根样式

    this.emit('start');
  }
  /**
   * @description: 判断是否登录
   */
  private isLogin() {
    if (!this._options.login) {
      this._rootState.system.state = SystemStateEnum.open;
      return;
    } else {
      if (this._options.login.init?.()) {
        this._rootState.system.state = SystemStateEnum.open;
        return;
      }

      this._rootState.system.state = SystemStateEnum.lock;
      const tempCallBack = this._options.loginCallback;
      if (!tempCallBack) {
        throw new Error('没有设置登录回调函数');
      }
      this._options.loginCallback = async (username: string, password: string) => {
        const res = await tempCallBack(username, password);
        if (res) {
          this._rootState.system.state = SystemStateEnum.open;
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
    const back = await this.fs.readFile('/C/System/Vtron/background.txt');
    if (back) {
      this._rootState.system.options.background = back;
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
    this._rootState.system.options.desktop?.forEach((item) => {
      this.addApp(item);
    });
    this._rootState.system.options.magnet?.forEach((item) => {
      this.addMagnet(item);
    });
    this._rootState.system.options.menulist?.forEach((item) => {
      this.addMenuList(item);
    });
  }
  private async initFileSystem() {
    // 如果传入了自定义fs，就使用传入的fs
    if (this._options.fs) {
      this.fs = this._options.fs;
    } else {
      this.fs = await new VtronFileSystem().initFileSystem();
      await createInitFile(this, this._options.initFile || InitFile);
      this.fs.registerWatcher(/^\/C\/Users\//, () => {
        initAppList();
      });
    }
  }
  private async initShell() {
    if (this._options.shell) {
      this._shell = this._options.shell;
    } else {
      this._shell = new Shell(this, '/', 'root');
    }
  }
  private async initSavedConfig() {
    const config = await this.fs.readFile('/C/System/Vtron/config.json');
    if (config) {
      try {
        this._rootState.system.options = Object.assign(this._rootState.system.options, JSON.parse(config));
      } catch {
        new Notify({
          title: 'Vtron',
          content: '配置文件格式错误',
        });
      }
    }
  }
  private addWindowSysLink(loc: string, options: WinAppOptions) {
    if (this.isFirstRun) {
      this.fs.writeFile(`/C/Users/${loc}/` + options.name + '.exe', {
        content: `link:${loc}:${options.name}:${options.icon?.length}:${options.icon}`,
      });
    } else {
      initAppList();
    }
    if (typeof options.window.content === 'string') {
      // TODO: 当content是string的时候
    } else {
      options.window.content = markRaw(options.window.content);
    }
    this._rootState.system.windowMap[loc].set(options.name, options.window);
  }

  async runPlugin(system: System) {
    const pluginsFile = await this.fs.readdir('/C/System/plugs');
    if (pluginsFile) {
      pluginsFile.forEach((file) => {
        if (file.isFile) {
          const content = file.content;
          if (content) {
            new Shell(system, '/', 'root').exec('node ' + file.path);
          }
        }
      });
    }
  }
  /**
   * @description: 添加应用
   */
  addApp(options: WinAppOptions) {
    this.addWindowSysLink('Desktop', options);
  }
  addMagnet(options: WinAppOptions) {
    this.addWindowSysLink('Magnet', options);
  }
  addMenuList(options: WinAppOptions) {
    this.addWindowSysLink('Menulist', options);
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
    this._rootState.system.state = SystemStateEnum.close;
  }
  reboot() {
    this._rootState.system.state = SystemStateEnum.close;
    window.location.reload();
  }
  recover() {
    this.fs.removeFileSystem();
    localStorage.removeItem('vtronFirstRun');
    this._rootState.system.state = SystemStateEnum.close;
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
  registerFileOpener(type: string, opener: FileOpener) {
    this._flieOpenerMap.set(type, opener);
  }
  openLink(path: string, content: string) {
    const exeContent = content.split(':');
    // exeContent[1]= loc
    // exeContent[2]= name
    // exeContent[3]= icon.length
    // exeContent[4]= icon
    const winopt = this._rootState.system.windowMap[exeContent[1]].get(content.split(':')[2]);
    if (winopt) {
      const win = new BrowserWindow(winopt);
      win.show();
    }
  }
  /**打开vtron 文件系统的文件 */
  openFile(path: string) {
    this.fs.stat(path).then((res) => {
      if (res?.isDirectory) {
        this._flieOpenerMap.get('dir')?.func.call(this, path, res?.content || '');
        return;
      } else {
        this._flieOpenerMap
          .get(extname(res?.path || '') || 'link')
          ?.func.call(this, path, res?.content || '');
      }
    });
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
}
function useSystem() {
  return GLOBAL_SYSTEM!;
}
export { System, useSystem };
