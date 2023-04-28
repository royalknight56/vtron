import { defineComponent, nextTick, reactive, DefineComponent, markRaw } from "vue";
import { useRootState } from "../state/Root";
import { Tree } from "@packages/util/Tree";
import { Eventer } from "../event";

// import { BrowserWindowConstructorOptions } from "@packages/type/browserWindow";
// implements BrowserWindowModel
const enum WindowStateEnum {
    normal = 'normal',
    minimize = 'minimize',
    maximize = 'maximize',
    fullscreen = 'fullscreen'
}
type BrowserWindowContent = ReturnType<typeof defineComponent> | string
interface BrowserWindowConstructorOptions {
    title: string
    content: BrowserWindowContent,
    config?: any
    icon: string
    width: number
    height: number
    x: number
    y: number
    center: boolean
    resizable: boolean
    minimizable: boolean
    frame: boolean
    fullscreen: boolean
    alwaysOnTop: boolean
    skipTaskbar: boolean
    backgroundColor: string
}
interface WindowInfo extends BrowserWindowConstructorOptions {
    state: WindowStateEnum
    istop: boolean
    zindex: number
    isCreated: boolean
    disable: boolean
}
type BrowserWindowOption = Partial<Omit<BrowserWindowConstructorOptions, 'content'>> & { content: BrowserWindowContent }
class BrowserWindow {
    public static defaultOption: Omit<BrowserWindowConstructorOptions, 'content'> = {
        title: "新窗口",
        width: 800,
        height: 600,
        icon: '',
        x: 0,
        y: 0,
        center: false,
        resizable: true,
        minimizable: true,
        frame: true,
        fullscreen: false,
        alwaysOnTop: false,
        skipTaskbar: false,
        backgroundColor: '#fff'
    }
    public static defaultInfo: Omit<WindowInfo, keyof BrowserWindowConstructorOptions> = {
        state: WindowStateEnum.normal,
        istop: false,
        zindex: 0,
        isCreated: false,
        disable: false
    }
    readonly windowInfo: WindowInfo
    private _option: BrowserWindowConstructorOptions
    private _builtin: {
        previousState: WindowStateEnum
    }
    id: number
    children: Array<BrowserWindow> = []
    content?: ReturnType<typeof defineComponent> | string
    config: any
    eventer: Eventer = new Eventer()
    constructor(option?: BrowserWindowOption, parent?: BrowserWindow) {
        this._option = Object.assign({}, BrowserWindow.defaultOption, option);
        this.config = this._option.config;
        if (typeof this._option.content !== "string") {
            this.content = markRaw(this._option.content);
        } else {
            this.content = this._option.content;
        }
        let rootState = useRootState();
        this.id = rootState.system.winnum;
        rootState.system.winnum++;

        this.windowInfo = reactive(Object.assign({}, BrowserWindow.defaultInfo, this._option));
        if (this._option.fullscreen) {
            this.windowInfo.state = WindowStateEnum.fullscreen;
        }
        this._builtin = {
            previousState: this.windowInfo.state,
        }


    }

    _setZindex() {
        this.windowInfo.zindex = 20 +
            useRootState().system.windowTree.findIndex(this,
                (val: Tree<BrowserWindow>) => { return val.value.isVisible() });
    }
    private _setState(state: WindowStateEnum) {
        this._builtin.previousState = this.windowInfo.state;
        this.windowInfo.state = state;
    }
    private _getWinInner() {
        let rootState = useRootState();
        return {
            width: rootState.system.info.screenWidth,
            height: rootState.system.info.screenHeight
        }
    }
    private _makeWindowNotOverSize() {// 使窗口不超过屏幕大小
        if (this.windowInfo) {
            if (this.windowInfo.resizable) {//只有可缩放窗口
                let { x, y, width, height } = this.windowInfo;
                let { width: winWidth, height: winHeight } = this._getWinInner();//获取窗口大小

                if (winWidth == 0 && winHeight == 0) {
                    return
                }
                if (x + width > winWidth) {
                    this.windowInfo.width = winWidth - x;
                }
                if (y + height > winHeight) {
                    this.windowInfo.height = winHeight - y;
                }
            }
        }
    }
    on(event: string, callback: Function) {
        this.eventer.on(event, callback);
    }
    emit(event: string, ...args: any[]) {
        this.eventer.emit(event, 'window', ...args);
    }
    moveTop() {// 窗口置顶
        let rootState = useRootState();
        let tree = rootState.system.windowTree;
        let treeNode = tree.findNode(this);
        if (treeNode) {
            tree.removeChild(treeNode.value);
        }
        tree.addChild(this);
        // this._setZindex();
        useRootState().system.topWindow = this;
        useRootState().system.windowTree.traverseBFS((val) => {
            if (val.value.id !== undefined) {
                val.value._setZindex();
            }
        });
    }
    show() {
        if (!this.windowInfo.isCreated) {
            let rootState = useRootState();
            rootState.system.windowTree.addChild(this);
            rootState.system.windowOrder.push(this);
            this.windowInfo.isCreated = true;
            if (this._option.center) {
                this.center();
            }
        }
        // this._setZindex();
        this._makeWindowNotOverSize();// 使得窗口在生成时，不超过屏幕
        this.moveTop();
        this.eventer.emit("show", "show");
    }
    destroy() {// 销毁窗口
        // TODO:
        this.close();
        this.eventer.emit("closed", "closed");
    }
    close() {// 关闭窗口
        this.windowInfo.isCreated = false;
        let rootState = useRootState();
        rootState.system.windowOrder.splice(rootState.system.windowOrder.findIndex((val) => {
            return val === this;
        }), 1);
        rootState.system.windowTree.removeNode(this);
        this.eventer.emit("closed", "closed");
    }
    /**
     * Moves window to the center of the screen.
     */
    center() {
        let { width, height } = this._getWinInner();
        this.windowInfo.x = (width - this.windowInfo.width) / 2;
        this.windowInfo.y = (height - this.windowInfo.height) / 2;
        if (this.windowInfo.x < 0) {
            this.windowInfo.x = 0;
        }
        if (this.windowInfo.y < 0) {
            this.windowInfo.y = 0;
        }
    }
    /**
     * Restores the window from minimized state to its previous state.
     */
    restore() {
        this.windowInfo.state = this._builtin.previousState;
    }
    maximize() {// 最大化窗口
        this._setState(WindowStateEnum.maximize);
    }
    unmaximize() {// 取消最大化窗口
        this._setState(WindowStateEnum.normal);
    }
    minimize() {// 最小化窗口
        this._setState(WindowStateEnum.minimize);
    }

    isVisible() {// 判断窗口是否可见
        return this.windowInfo.isCreated;
    }
    isDestroyed() {// 判断窗口是否已经销毁
        return !this.windowInfo.isCreated;
    }
    isMaximized() {// 判断窗口是否最大化
        return this.windowInfo.state === WindowStateEnum.maximize;
    }
    isMaximizable() {// 判断窗口是否可以最大化
        return true;
    }
    isMinimized() {// 判断窗口是否最小化
        return this.windowInfo.state === WindowStateEnum.minimize;
    }
    isMinimizable() {// 判断窗口是否可以最小化
        return this.windowInfo.minimizable;
    }
    isNormal() {// 判断窗口是否正常
        return this.windowInfo.state === WindowStateEnum.normal;
    }
    isResizable() {// 判断窗口是否可以改变大小
        return this.windowInfo.resizable;
    }
    isFullScreen() {// 判断窗口是否全屏
        return this.windowInfo.state === WindowStateEnum.fullscreen;
    }
    isDisable() {// 判断窗口是否禁用
        return this.windowInfo.disable;
    }
    /**
     * Contains the window's width and height.
     */
    getSize() {
        return [this.windowInfo.width, this.windowInfo.height];
    }
    getTitle() {
        return this.windowInfo.title;
    }
    getPosition() {
        return [this.windowInfo.x, this.windowInfo.y];
    }
    setFullScreen(flag: boolean) {// 设置窗口全屏
        if (flag) {
            this._setState(WindowStateEnum.fullscreen);
        } else {
            this._setState(WindowStateEnum.normal);
        }
    }
    setSize(width: number, height: number) {
        this.windowInfo.width = width;
        this.windowInfo.height = height;
    }
    setTitle(title: string) {
        this.windowInfo.title = title;
    }
    setPosition(x: number, y: number) {
        this.windowInfo.x = x;
        this.windowInfo.y = y;
    }
    setDisable(flag: boolean) {
        this.windowInfo.disable = flag;
    }

}
export {
    BrowserWindow,
    WindowStateEnum,
    BrowserWindowOption
}