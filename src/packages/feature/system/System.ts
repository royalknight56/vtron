import { initRootState } from "@/packages/feature/state/Root";
import { SystemStateEnum } from "@/packages/type/enum"
import { watch } from "vue";
import { RootState, SystemOptions,WinApp } from "@/packages/type/type";
import { initEventer, Eventer,initEventListener } from "@packages/feature/event";
// import { RootState, SystemOptions } from "@/packages/type/type";
let GLOBAL_SYSTEM: System | null = null;
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
    constructor(options?: SystemOptions) {
        this._options = this.initOptions(options);
        this._rootState = this.initRootState(options);
        this._eventer = this.initEvent(options);
        this.initApp(options);
        this.initSystem(options);

        this.setRef(this._rootState.ref!);
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
    private initSystem(options?: SystemOptions) {
        /**
         * 过程：激活屏幕，桥接事件。
         */
        initEventListener();
        this._ready?.(this);
        this._rootState.system.state = SystemStateEnum.open;
        setTimeout(() => {
            this._rootState.system.state = SystemStateEnum.open;
        }, 1000);
        GLOBAL_SYSTEM = this;
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
    addApp(options:Partial<WinApp>) {
        this._rootState.system.apps.push(options);
    }
    addMagnet(options:Partial<WinApp>) {
        this._rootState.system.magnet.push(options);
    }
    addMenuList(options:Partial<WinApp>) {
        this._rootState.system.menulist.push(options);
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
        if(this._rootState.system.state === SystemStateEnum.open){
            return Promise.resolve(this);
        }
        return new Promise<System>((resolve, reject) => {
            this._ready = resolve;
            this._error = reject;
            this._ready?.(this);
        })
    }
    shutdown() {
        this._rootState.system.state = SystemStateEnum.close;
    }
    reboot() {
        this._rootState.system.state = SystemStateEnum.open;
    }
}
function useSystem() {
    return GLOBAL_SYSTEM;
}
export { System, useSystem };