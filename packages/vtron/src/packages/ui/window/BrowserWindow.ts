import { Eventer, useSystem } from '@/packages/kernel';
import { Tree } from '@packages/util/Tree';
import { defineComponent, markRaw, reactive } from 'vue';
// import { BrowserWindowConstructorOptions } from "@packages/type/browserWindow";
// implements BrowserWindowModel
export const enum WindowStateEnum {
  normal = 'normal',
  minimize = 'minimize',
  maximize = 'maximize',
  fullscreen = 'fullscreen',
}
export type BrowserWindowContent = ReturnType<typeof defineComponent> | string;
export interface BrowserWindowConstructorOptions {
  title: string;
  content: BrowserWindowContent;
  config?: any;
  icon: string;
  width: number;
  height: number;
  x: number;
  y: number;
  center: boolean;
  resizable: boolean;
  minimizable: boolean;
  frame: boolean;
  fullscreen: boolean;
  alwaysOnTop: boolean;
  skipTaskbar: boolean;
  backgroundColor: string;
}
export interface WindowInfo extends BrowserWindowConstructorOptions {
  state: WindowStateEnum;
  istop: boolean;
  zindex: number;
  isCreated: boolean;
  disable: boolean;
}
export type BrowserWindowOption = Partial<Omit<BrowserWindowConstructorOptions, 'content'>> & {
  content: BrowserWindowContent;
};
class BrowserWindow {
  public static defaultOption: Omit<BrowserWindowConstructorOptions, 'content'> = {
    title: '新窗口',
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
    backgroundColor: '#fff',
  };
  public static defaultInfo: Omit<WindowInfo, keyof BrowserWindowConstructorOptions> = {
    state: WindowStateEnum.normal,
    istop: false,
    zindex: 0,
    isCreated: false,
    disable: false,
  };
  readonly windowInfo: WindowInfo;
  private _option: BrowserWindowConstructorOptions;
  private _builtin: {
    previousState: WindowStateEnum;
  };
  id: number;
  children: Array<BrowserWindow> = [];
  content?: ReturnType<typeof defineComponent> | string;
  config: any;
  eventer: Eventer = new Eventer();
  constructor(option?: BrowserWindowOption) {
    this._option = Object.assign({}, BrowserWindow.defaultOption, option);
    this.config = this._option.config;
    if (typeof this._option.content !== 'string') {
      this.content = markRaw(this._option.content);
    } else {
      this.content = this._option.content;
    }

    const rootState = useSystem()._rootState;
    this.id = rootState.winnum;
    rootState.winnum++;

    this.windowInfo = reactive(Object.assign({}, BrowserWindow.defaultInfo, this._option));
    if (this._option.fullscreen) {
      this.windowInfo.state = WindowStateEnum.fullscreen;
    }
    this._builtin = {
      previousState: this.windowInfo.state,
    };
  }

  private _setZindex() {
    this.windowInfo.zindex =
      20 +
      useSystem()._rootState.windowTree.findIndex(this, (val: Tree<BrowserWindow>) => {
        return val.value.isVisible();
      });
  }
  private _setState(state: WindowStateEnum) {
    if (state !== WindowStateEnum.minimize) {
      this._builtin.previousState = state;
    }
    this.windowInfo.state = state;
  }
  private _getWinInner() {
    const rootState = useSystem()._rootState;
    return {
      width: rootState.info.screenWidth,
      height: rootState.info.screenHeight,
    };
  }
  private _makeWindowNotOverSize() {
    // 使窗口不超过屏幕大小
    if (this.windowInfo) {
      if (this.windowInfo.resizable) {
        //只有可缩放窗口
        const { x, y, width, height } = this.windowInfo;
        const { width: winWidth, height: winHeight } = this._getWinInner(); //获取窗口大小

        if (winWidth == 0 && winHeight == 0) {
          return;
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
  /**
   * Adds a listener to the window.
   * @param event The event name.
   * @param callback The callback function.
   */
  addEventListener(event: string, callback: (...arg: any) => void) {
    this.eventer.on(event, callback);
  }
  /**
   * Removes a listener from the window.
   * @param event The event name.
   * @param callback The callback function.
   */
  removeEventListener(event: string, callback?: (...arg: any) => void) {
    this.eventer.off(event, callback);
  }
  on(event: string, callback: (...arg: any) => void) {
    this.eventer.on(event, callback);
  }
  emit(event: string, ...args: any[]) {
    this.eventer.emit(event, 'window', ...args);
  }
  moveTop() {
    // 窗口置顶
    const rootState = useSystem()._rootState;
    const tree = rootState.windowTree;
    const treeNode = tree.findNode(this);
    if (treeNode) {
      tree.removeChild(treeNode.value);
    }
    tree.addChild(this);

    useSystem()._rootState.topWindow = this;
    useSystem()._rootState.windowTree.traverseBFS((val) => {
      if (val.value.id !== undefined) {
        val.value._setZindex();
        val.value.windowInfo.istop = false;
        if (val.value.id !== this.id) {
          val.value.blur();
        }
      }
    });
    this.windowInfo.istop = true;
    this.emit('moveTop');
    this.focus();
  }
  show() {
    if (!this.windowInfo.isCreated) {
      const rootState = useSystem()._rootState;
      rootState.windowTree.addChild(this);
      rootState.windowOrder.push(this);
      this.windowInfo.isCreated = true;
      if (this._option.center) {
        this.center();
      }
    }
    this._makeWindowNotOverSize(); // 使得窗口在生成时，不超过屏幕
    this.emit('show', 'show');
    this.moveTop();
  }
  focus() {
    // 窗口获得焦点
    this.emit('focus');
  }
  blur() {
    // 窗口失去焦点
    this.emit('blur');
  }
  destroy() {
    // 销毁窗口
    // TODO:
    this.close();
  }
  close() {
    // 关闭窗口
    this.emit('close', 'close');
    this.emit('state', 'close');
    const rootState = useSystem()._rootState;
    if (this.windowInfo.isCreated) {
      this.windowInfo.isCreated = false;
      rootState.windowTree.removeNode(this);
      // Vue bug
      setTimeout(() => {
        const ind = rootState.windowOrder.findIndex((val) => {
          return val === this;
        });
        if (ind === -1) return;
        rootState.windowOrder.splice(ind, 1);
      }, 500);
    }
  }
  /**
   * Moves window to the center of the screen.
   */
  center() {
    const { width, height } = this._getWinInner();
    this.windowInfo.x = (width - this.windowInfo.width) / 2;
    this.windowInfo.y = (height - this.windowInfo.height) / 2;
    if (this.windowInfo.x < 0) {
      this.windowInfo.x = 0;
    }
    if (this.windowInfo.y < 0) {
      this.windowInfo.y = 0;
    }
    this.emit('move', this.windowInfo.x, this.windowInfo.y);
  }
  /**
   * Restores the window from minimized state to its previous state.
   */
  restore() {
    this.windowInfo.state = this._builtin.previousState;
    this.emit('restore');
    this.emit('state', 'restore');
  }
  maximize() {
    // 最大化窗口
    this._setState(WindowStateEnum.maximize);
    this.emit('maximize');
    this.emit('state', 'maximize');
    setTimeout(() => {
      this.emit('resize', this.windowInfo.width, this.windowInfo.height);
    }, 200);
  }
  unmaximize() {
    // 取消最大化窗口
    this._setState(WindowStateEnum.normal);
    this.emit('unmaximize');
    this.emit('state', 'unmaximize');
    setTimeout(() => {
      this.emit('resize', this.windowInfo.width, this.windowInfo.height);
    }, 100);
  }
  minimize() {
    // 最小化窗口
    this._setState(WindowStateEnum.minimize);
    this.emit('minimize');
    this.emit('state', 'minimize');
  }

  isVisible() {
    // 判断窗口是否可见
    return this.windowInfo.isCreated;
  }
  isDestroyed() {
    // 判断窗口是否已经销毁
    return !this.windowInfo.isCreated;
  }
  isMaximized() {
    // 判断窗口是否最大化
    return this.windowInfo.state === WindowStateEnum.maximize;
  }
  isMaximizable() {
    // 判断窗口是否可以最大化
    return true;
  }
  isMinimized() {
    // 判断窗口是否最小化
    return this.windowInfo.state === WindowStateEnum.minimize;
  }
  isMinimizable() {
    // 判断窗口是否可以最小化
    return this.windowInfo.minimizable;
  }
  isNormal() {
    // 判断窗口是否正常
    return this.windowInfo.state === WindowStateEnum.normal;
  }
  isResizable() {
    // 判断窗口是否可以改变大小
    return this.windowInfo.resizable;
  }
  isFullScreen() {
    // 判断窗口是否全屏
    return this.windowInfo.state === WindowStateEnum.fullscreen;
  }
  isDisable() {
    // 判断窗口是否禁用
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
  setFullScreen(flag: boolean) {
    // 设置窗口全屏
    if (flag) {
      this._setState(WindowStateEnum.fullscreen);
    } else {
      this._setState(WindowStateEnum.normal);
    }
    this.emit('fullscreen', flag);
  }
  setSize(width: number, height: number) {
    this.windowInfo.width = width;
    this.windowInfo.height = height;
    this.emit('resize', width, height);
  }
  setTitle(title: string) {
    this.windowInfo.title = title;
    this.emit('title', title);
  }
  setPosition(x: number, y: number) {
    this.windowInfo.x = x;
    this.windowInfo.y = y;
    this.emit('move', x, y);
  }
  setDisable(flag: boolean) {
    this.windowInfo.disable = flag;
    this.emit('disable', flag);
  }
}
export { BrowserWindow };
