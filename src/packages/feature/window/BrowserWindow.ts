import { defineComponent, nextTick, reactive, DefineComponent, markRaw } from "vue";
import { useRootState } from "../state/Root";
// import { BrowserWindowConstructorOptions } from "@packages/type/browserWindow";
// implements BrowserWindowModel
interface BrowserWindowConstructorOptions {
    title: string
    content: ReturnType<typeof defineComponent>,
    icon: string
}
interface WindowInfo {
    title: string
    width: number
    height: number
    x: number
    y: number
    resizable: boolean
    isMaximize: boolean
    istop: boolean
    isCreated: boolean
    icon: string
}
class BrowserWindow {
    windowInfo: WindowInfo
    private _option: Partial<BrowserWindowConstructorOptions>
    id: number
    content?: DefineComponent
    constructor(option?: Partial<BrowserWindowConstructorOptions>, parent?: BrowserWindow) {
        this._option = option || {};
        this.content = markRaw(this._option.content);
        let rootState = useRootState();
        this.id = rootState.system.winnum;
        rootState.system.winnum++;

        this.windowInfo = reactive(Object.assign({}, {
            title: "新窗口",
            width: 800,
            height: 600,
            x: 0,
            y: 0,
            resizable: true,
            isMaximize: false,
            istop: false,
            isCreated: false,
            icon: ""
        }, this._option));
        rootState.system.windowTree.addChild(this);
    }
    moveTop() {// 窗口置顶
        let rootState = useRootState();
        let tree = rootState.system.windowTree;
        let node = tree.findNode(this);
        if (node) {
            tree.removeChild(node);
            tree.addChild(this);
        }
    }
    show(){
        this.windowInfo.isCreated = true;
        this.makeWindowNotOverSize();// 使得窗口在生成时，不超过屏幕
        this.moveTop();
    }
    maximize() {// 最大化窗口
        this.windowInfo.isMaximize = true;
    }
    unmaximize() {// 取消最大化窗口
        this.windowInfo.isMaximize = false;
    }
    minimize(){// 最小化窗口
        this.windowInfo.isCreated = false;
    }
    close(){// 关闭窗口
        // TODO:
        this.windowInfo.isCreated = false;
    }

    private getWinInner() {
        // TODO: 获取的是系统的大小
        return {
            width: this.windowInfo.width,
            height: this.windowInfo.height
        }
    }
    private makeWindowNotOverSize() {// 使窗口不超过屏幕大小
        if (this.windowInfo) {
            if (this.windowInfo.resizable) {//只有可缩放窗口
                let { x, y, width, height } = this.windowInfo;
                let { width: winWidth, height: winHeight } = this.getWinInner();//获取窗口大小

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
    /*
    private afterRegister() {// 注册之后的操作
        this.makeWindowNotOverSize();// 使得窗口在生成时，不超过屏幕
        if (this.windowInfo.center) {
            this.center()
        }
        nextTick(() => {
            this.moveTop()//新窗口在顶部
        })
    }
    getWinid() {// 获取窗口id
        return this.windowInfo.id
    }
    show() {// 调用show之后，注册窗口，展示窗口
        this.windowInfo.isCreate = true
        this.windowInfo.isVisible = true// 显示窗口
        this.windowInfo.callData = callData || this.windowInfo.callData;
        this.afterRegister()//注册之后
        return this
    }
    hide() {// 隐藏窗口
        this.windowInfo.isVisible = false
        return this
    }
    destroy() {// 销毁窗口
        this.windowInfo.isCreate = false
        this.windowInfo.isMaximize = false;
        this.windowInfo.status = WindowStatusEnum.close
    }
    isMinimized() {// 是否最小化
        return this.windowInfo.isVisible ? false : true
    }
    minimize() {// 最小化窗口
        this.windowInfo.isVisible = false;
        return this
    }
    restore() {// 恢复窗口
        this.windowInfo.isVisible = true;
        return this
    }
    isMaximized() {// 是否最大化
        return this.windowInfo.isMaximize
    }
    maximize() {// 最大化窗口
        this.windowInfo.isMaximize = true;
        this.windowInfo.status = WindowStatusEnum.max
        return this
    }
    unmaximize() {// 取消最大化窗口
        this.windowInfo.isMaximize = false;
        this.windowInfo.status = WindowStatusEnum.normal
        return this
    }
    moveTop() {
        for (let key in this.system.State.windowInfoMap) {
            this.system.State.windowInfoMap[key].windowInfo.istop = false
        }
        this.windowInfo.istop = true

        let ind = this.system.State.zIndexIdArray.indexOf(this.id);
        this.system.State.zIndexIdArray.splice(ind, 1);
        this.system.State.zIndexIdArray.push(this.id);
        for (let i = 0; i < this.system.State.zIndexIdArray.length; i++) {
            this.system.State.windowInfoMap[this.system.State.zIndexIdArray[i]].windowInfo.zindex = i + 10
        }
        return this
    }
    isNormal() {
        return !this.isMaximized() && !this.isMinimized()
    }
    setSize(width: number, height: number) {// 设置窗口大小
        this.windowInfo.width = width;
        this.windowInfo.height = height;
        this.makeWindowNotOverSize();
        return this
    }
    getSize() {// 获取窗口大小
        return {
            width: this.windowInfo.width,
            height: this.windowInfo.height
        }
    }
    setPosition(x: number, y: number) {// 设置窗口位置
        this.windowInfo.x = x;
        this.windowInfo.y = y;
        return this
    }
    getPosition() {// 获取窗口位置
        return {
            x: this.windowInfo.x,
            y: this.windowInfo.y
        }
    }
    center() {
        this.setPosition((this.system.State.sysInfo.width - this.windowInfo.width) / 2, (this.system.State.sysInfo.height - this.windowInfo.height) / 2)
        return this
    }
    setFullScreen(isFull: boolean) {// 设置全屏
        this.windowInfo.fullscreen = isFull;
        if(isFull){
            this.windowInfo.status = WindowStatusEnum.fullscreen
        }else{
            this.windowInfo.status = WindowStatusEnum.normal
        }
    }
    */
}
export {
    BrowserWindow
}