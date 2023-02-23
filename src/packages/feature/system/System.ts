import { initRootState } from "@/packages/feature/state/Root";
import { SystemStateEnum } from "@/packages/type/enum"
import { watch } from "vue";
import { initEventer, Eventer } from "../event/EventHook";
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
    constructor(options?: SystemOptions) {
        this._options = this.initOptions(options);
        this._rootState = this.initRootState(options);
        this._eventer = this.initEvent(options);
        this.initApp(options);
        this.initSystem(options);
    }
    /**
     * @description: pure 初始化配置选项
     */
    private initOptions(options?: SystemOptions) {
        let tempOptions = Object.assign({
            logo: "default",
            background: "default"
        }, options);
        // TODO: 处理 backkground的纯色和图片
        return tempOptions;
    }
    /**
     * @description: 获取系统配置
     */
    private initRootState(options?: SystemOptions) {
        return initRootState(this._options);
    }
    /**
     * @description: 初始化系统
     */
    private initSystem(options?: SystemOptions) {
        /**
         * 过程：激活屏幕，桥接事件。
         */
        this._ready?.(this);
        this._rootState.system.state = SystemStateEnum.opening;
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
    addApp() {

    }
    /**
     * @description: 移除应用
     */
    removeApp() {

    }
    whenReady(): Promise<System> {
        return new Promise<System>((resolve, reject) => {
            this._ready = resolve;
            this._error = reject;
            this._ready?.(this);
        })
    }
}
function useSystem() {
    return GLOBAL_SYSTEM;
}
export { System, useSystem };