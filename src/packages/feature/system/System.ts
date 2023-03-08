import { initRootState } from "@/packages/feature/state/Root";
import { SystemStateEnum } from "@/packages/type/enum"
import { watch } from "vue";
import { RootState, SystemOptions, WinApp, WinAppOptions } from "@/packages/type/type";
import { initEventer, Eventer, initEventListener, emitEvent, mountEvent } from "@packages/feature/event";
import { fs, VtronFileSystem, initFileSystem } from "../addon/FileSystem";
import { initAppList } from "@/packages/hook/useAppOpen";

let GLOBAL_SYSTEM: System | null = null;

export type VtronPlugin = (system: System, rootState: RootState) => void

/**
 * @description: System 类，在初始化的过程中需要提供挂载点，以及一些配置
 */
class System {
    private _options: SystemOptions;
    private _rootState: RootState;
    private _eventer: Eventer;
    private _ready: ((value: System) => void) | null = null;
    private _error: ((reason: unknown) => void) | null = null;
    ref!: HTMLElement;
    fs: VtronFileSystem;
    constructor(options?: SystemOptions) {
        this._options = this.initOptions(options);
        this._rootState = this.initRootState(options);
        this._eventer = this.initEvent(options);
        this.initApp(options);
        this.initSystem(options);

        this.setRef(this._rootState.ref!);
        this.fs = fs;
    }
    setRef(ref: HTMLElement) {
        this.ref = ref;
    }
    /**
     * @description: pure 初始化配置选项
     */
    private initOptions(options?: SystemOptions) {
        let tempOptions = Object.assign({
            logo: "default",
            background: "#3A98CE"
        }, options);
        return tempOptions;
    }
    /**
     * @description: 获取系统配置
     */
    private initRootState(options?: SystemOptions): RootState {
        return initRootState(this._options);
    }
    /**
     * @description: 初始化系统
     */
    private async initSystem(options?: SystemOptions) {
        /**
         * 过程：激活屏幕，桥接事件。
         */
        this._rootState.system.state = SystemStateEnum.opening;
        initEventListener();

        GLOBAL_SYSTEM = this;

        await initFileSystem();
        initAppList();
        this._rootState.system.state = SystemStateEnum.open;
        this._ready && this._ready(this);
    }
    /**
     * @description: 初始化事件系统
     */
    private initEvent(options?: SystemOptions) {
        /**
         * 过程：监听事件，处理事件
         */
        return initEventer();
    }
    /**
     * @description: 初始化应用
     */
    private initApp(options?: SystemOptions) {
        /**
         * 过程：挂载应用
         */
    }
    /**
     * @description: 添加应用
     */
    addApp(options: WinAppOptions) {
        this.fs.writeFile('/C/Users/Desktop/' + options.name, {
            name: options.name,
            icon: options.icon || '',
            type: 'link',
            content: `link:Desktop:${options.name}`
        })
        this._rootState.system.windowMap.Desktop.set(options.name, options.window);
    }
    addMagnet(options: WinAppOptions) {
        this.fs.writeFile('/C/Users/Magnet/' + options.name, {
            name: options.name || 'test',
            icon: options.icon || '',
            type: 'link',
            content: `link:Magnet:${options.name}`
        });
        this._rootState.system.windowMap.Magnet.set(options.name, options.window);
    }
    addMenuList(options: WinAppOptions) {
        this.fs.writeFile('/C/Users/Menulist/' + options.name, {
            name: options.name || 'test',
            icon: options.icon || '',
            type: 'link',
            content: `link:Menulist:${options.name}`
        })
        this._rootState.system.windowMap.Menulist.set(options.name, options.window);
    }
    /**
     * @description: 清楚应用
     */
    clearApp() {
        this._rootState.system.apps = [];
    }
    clearMagnet() {
        this._rootState.system.magnet = [];
    }
    clearMenuList() {
        this._rootState.system.menulist = [];
    }

    whenReady(): Promise<System> {
        return new Promise<System>((resolve, reject) => {
            this._ready = resolve;
            this._error = reject;
        })
    }
    shutdown() {
        this._rootState.system.state = SystemStateEnum.close;
    }
    reboot() {
        this._rootState.system.state = SystemStateEnum.open;
    }
    emitEvent(event: string, ...args: any[]) {
        emitEvent(event, ...args);
    }
    mountEvent(event: string, callback: (...args: any[]) => void) {
        mountEvent(event, callback);
    }
    register(type: 'contextmenu') {

    }
    /**打开vtron 文件系统的文件 */
    openFile(path: string) {
        fs.getFileInfo(path).then((res) => {
            if (res?.type === 'link') {
                this._rootState.system.windowMap[
                    res.content.split(':')[1]
                ].get(res.content.split(':')[2])?.show();
            }
        })
    }
    // 插件系统
    use(func: VtronPlugin): void {
        return func(this, this._rootState);
    }
}
function useSystem() {
    return GLOBAL_SYSTEM;
}
export { System, useSystem };