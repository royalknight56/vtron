import { initRootState } from "@/packages/feature/state/Root";
import {SystemStateEnum } from "@/packages/type/enum"
import { watch } from "vue";
// import { RootState, SystemOptions } from "@/packages/type/type";
let GLOBAL_SYSTEM: System|null = null;
/**
 * @description: System 类，在初始化的过程中需要提供挂载点，以及一些配置
 */
class System {
    private _options: SystemOptions;
    private _rootState: RootState;
    private _ready: ((value: System) => void) | null = null;
    private _error: ((reason: unknown) => void) | null = null;
    constructor(options?: SystemOptions) {
        this._options = this.initOptions(options);
        this._rootState = initRootState(this._options);
        this.init();
        GLOBAL_SYSTEM = this;
    }

    /**
     * @description: 初始化
     */
    init() {
        this.initSystem();
        this.initEvent();
        this.initApp();
        this._ready?.(this);
        this._rootState.system.state = SystemStateEnum.opening;
        setTimeout(() => {
            this._rootState.system.state = SystemStateEnum.open;
        }, 1000);
    }
    /**
     * @description: pure 初始化配置选项
     */
    private initOptions(options?: SystemOptions) {
        let tempOptions =  Object.assign({
            logo: "default",
            background: "default"
        }, options);
        // TODO: 处理 backkground的纯色和图片
        return tempOptions;
    }
    
    /**
     * @description: 初始化系统
     */
    private initSystem() {
        /**
         * 过程：激活屏幕，桥接事件。
         */
        
    }
    /**
     * @description: 初始化事件系统
     */
    private initEvent() {
        /**
         * 过程：监听事件，处理事件
         */
    }
    /**
     * @description: 初始化应用
     */
    private initApp() {
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
    whenReady():Promise<System> {
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
export {System,useSystem};