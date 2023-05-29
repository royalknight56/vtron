import { initRootState } from "@/packages/feature/state/Root";
import { SystemStateEnum } from "@/packages/type/enum"
import { markRaw, nextTick, reactive, watch } from "vue";
import { RootState, SystemOptions, WinAppOptions } from "@/packages/type/type";
import { initEventer, Eventer, initEventListener, emitEvent, mountEvent } from "@packages/feature/event";
import { VtronFileSystem } from "@/packages/feature/core/fileSystem";
import { initAppList } from "@/packages/hook/useAppOpen";
import vtronLogoIcon from "@/assets/vtron-icon-nobg.png?url";
import myComputerLogoIcon from "@/packages/assets/computer.ico?url";
import infoIcon from "@/packages/assets/info-icon.ico?url";
import termIcon from "@/packages/assets/term.ico?url";
import { Shell } from "@/packages/feature/core/Shell";
import { version } from "../../../../package.json";
import { BrowserWindow } from "@packages/feature/window/BrowserWindow";
import FileViewer from "../builtin/FileViewer.vue";
import MyComputerVue from "../builtin/MyComputer.vue";
import UrlBrowser from "../builtin/UrlBrowser.vue";
import Terminal from "../builtin/Terminal.vue";
import { extname } from "../core/Path";
let GLOBAL_SYSTEM: System | null = null;

export type VtronPlugin = (system: System, rootState: RootState) => void

/**
 * @description: System 类，在初始化的过程中需要提供挂载点，以及一些配置
 */
class System {
    readonly _options: SystemOptions;
    private _rootState: RootState;
    private _eventer: Eventer;
    private _ready: ((value: System) => void) | null = null;
    private _error: ((reason: unknown) => void) | null = null;
    private _readyToUpdata: boolean = false;
    private _flieOpenerMap: Map<string, (path: string, content: string) => void> = new Map();
    version = version;
    isFirstRun: boolean = true;
    ref!: HTMLElement;
    fs!: VtronFileSystem;
    constructor(options?: SystemOptions) {
        this._options = this.initOptions(options);
        this._rootState = this.initRootState(options);

        this._eventer = this.initEvent(options);

        this.initSystem(options);
        this.firstRun();
        this.setRef(this._rootState.ref!);
    }
    setRef(ref: HTMLElement) {
        this.ref = ref;
        if (this._options.rootStyle) {
            Object.keys(this._options.rootStyle).forEach((key) => {
                this.ref.style.setProperty(key, this._options.rootStyle[key]);
            });
        }
    }
    /**
     * @description: pure 初始化配置选项
     */
    private initOptions(options?: SystemOptions) {
        let tempOptions = Object.assign({
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
        this.registerFileOpener('.exe', this.openLink.bind(this))

        this.registerFileOpener(".txt", (path, content) => {
            let pdfwindow = new BrowserWindow({
                width: 400,
                height: 400,
                center: true,
                title: '文本文档',
                content: FileViewer,
                config: {
                    content: content,
                    path: path
                }
            });
            pdfwindow.show()
        });

        this.registerFileOpener("dir", (path, content) => {
            let pdfwindow = new BrowserWindow({
                width: 400,
                height: 400,
                center: true,
                title: '此电脑',
                content: MyComputerVue,
                icon: myComputerLogoIcon,
                config: {
                    content: content,
                    path: path
                }
            });
            pdfwindow.show()
        });

        this.registerFileOpener('.url', (path, content) => {
            let imgwindow = new BrowserWindow({
                width: 400,
                height: 400,
                icon: infoIcon,
                center: true,
                title: '',
                content: UrlBrowser,
                config: {
                    content: content,
                    path: path
                }
            });
            imgwindow.show()
        })

        GLOBAL_SYSTEM = this;

        this.fs = await this.initFileSystem();
        this.initApp();
        initAppList();
        this.addApp({
            name: '此电脑',
            icon: myComputerLogoIcon,
            window: {
                width: 400,
                height: 400,
                center: true,
                title: '此电脑',
                icon: myComputerLogoIcon,
                content: MyComputerVue,
                config: {
                    path: '/'
                }
            }
        });
        this.addApp({
            name: '终端',
            icon: termIcon,
            window: {
                width: 700,
                height: 470,
                center: true,
                title: '终端',
                icon: termIcon,
                content: Terminal,
                resizable: false,
                config: {
                    path: '/'
                }
            }
        })
        this._rootState.system.state = SystemStateEnum.open;
        this._ready && this._ready(this);
        this.fs.runPlugin(this)
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
    private initApp() {
        this._rootState.system.options.desktop?.forEach((item) => {
            this.addApp(item);
        })
        this._rootState.system.options.magnet?.forEach((item) => {
            this.addMagnet(item);
        })
        this._rootState.system.options.menulist?.forEach((item) => {
            this.addMenuList(item);
        })
    }
    private async initFileSystem() {
        let res = await new VtronFileSystem().initFileSystem()
        return res;
    }
    private addWindowSysLink(loc: string, options: WinAppOptions) {
        if (this.isFirstRun) {
            this.fs.writeFile(`/C/Users/${loc}/` + options.name +'.exe', {
                content: `link:${loc}:${options.name}:${options.icon?.length}:${options.icon}`
            });
        }
        if (typeof options.window.content === 'string') {

        } else {
            options.window.content = markRaw(options.window.content);
        }
        this._rootState.system.windowMap[loc].set(options.name, options.window);
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

    whenReady(): Promise<System> {
        return new Promise<System>((resolve, reject) => {
            this._ready = resolve;
            this._error = reject;
        })
    }
    firstRun() {
        if (localStorage.getItem('vtronFirstRun')) {
            this.isFirstRun = false;
            return false;
        } else {
            this.isFirstRun = true;
            localStorage.setItem('vtronFirstRun', 'true');
            emitEvent('firstRun');
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
    emitEvent(event: string, ...args: any[]) {
        emitEvent(event, ...args);
    }
    mountEvent(event: string, callback: (...args: any[]) => void) {
        mountEvent(event, callback);
    }
    registerFileOpener(type: string, func: (path: string, content: string) => void) {
        this._flieOpenerMap.set(type, func);
    }
    openLink(path: string, content: string) {
        console.log(path, content);
        let exeContent = content.split(':');
        // exeContent[1]= loc
        // exeContent[2]= name
        // exeContent[3]= icon.length
        // exeContent[4]= icon
        let winopt = this._rootState.system.windowMap[
            exeContent[1]
        ].get(content.split(':')[2]);
        if (winopt) {
            let win = new BrowserWindow(winopt);
            win.show();
        }
    }
    /**打开vtron 文件系统的文件 */
    openFile(path: string) {
        this.fs.stat(path).then((res) => {
            if(res?.isDirectory){
                this._flieOpenerMap.get('dir')?.(path, res?.content || '');
                return;
            }else{
                this._flieOpenerMap.get(extname(res?.path|| "") || 'link')?.(path, res?.content || '');
            }
        })
    }
    // 插件系统
    use(func: VtronPlugin): void {
        return func(this, this._rootState);
    }
    // 状态序列化和反序列化
    async serializeState(): Promise<string> {
        let serializeFile = await this.fs.serializeFileSystem();
        return JSON.stringify(serializeFile);
    }
    deserializeState(state: string) {
        this.fs.deserializeFileSystem(JSON.parse(state));
    }
}
function useSystem() {
    return GLOBAL_SYSTEM;
}
export { System, useSystem };