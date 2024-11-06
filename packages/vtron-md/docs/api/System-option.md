# System

在创建System 的时候，传入的参数就是系统的初始化的配置项

usage:

```typescript
import { System } from 'vtron';
let system = new System({
  desktop: [
    {
      name: 'HelloWorld',
      icon: someicon,
      window: {
        content: HelloWorld,
        icon: someicon,
      },
    },
  ],
});
```

## constructor

完整的类型定义如下SystemOptions：

```typescript

interface SystemOptions {
    id?: number;
    /**
     * @description: 语言
     */
    lang?: string;
    /**
     * @description: logo
     */
    logo?: string;
    background?: string;
    rootStyle?: any;
    builtinFeature?: BuiltinFeature[];
    desktop?: WinAppOptions[];
    magnet?: WinAppOptions[];
    menulist?: WinAppOptions[];
    fs?: VtronFileInterface;
    userLocation?: string;
    systemLocation?: string;
    initFile?: InitFileItem;
    shell?: ShellInterface;
    brightness?: number;
    login?: {
        username: string;
        password: string;
        init?: () => boolean;
    };
    contextMenus?: Array<MenuItemConstructorOptions | MenuItem>;
    noPassword?: boolean;
    loginCallback?: (username: string, password: string) => Promise<boolean>;
    /**
     * 不立即挂载系统，默认为false
     */
    unMount?: boolean;
}

export interface WinAppOptions {
    name:string;
    icon?:string;
    order?:number;
    window: {
        title: string
        content: BrowserWindowContent,
        config: any
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
}

constructor(options?: SystemOptions)
```
## id

系统的id，用来区分当一个页面下有多个系统的时候

建议设置一个固定的id

## lang

系统的语言，目前支持中文和英文

支持的值：'zh-CN' | 'en-US'

## logo

系统左下角的 logo

默认是win10的logo，传入字符串改变

## background

系统的背景图

默认是win10的背景图，传入字符串改变

## builtinFeature

系统内置的各种特性功能，可以通过数组设置是否显示

type BuiltinFeature =
  | 'MyComputer'
  | 'AppStore'
  | 'DataTimeTray'
  | 'BatteryTray'
  | 'NetworkTray'
  | 'ImageOpener'
  | 'UrlOpener'
  | 'TextOpener'
  | 'ShortCutOpener'
  | 'ExeOpener';


默认值是 ['MyComputer', 'AppStore', 'DataTimeTray', 'BatteryTray', 'NetworkTray', 'ImageOpener', 'UrlOpener', 'TextOpener', 'ShortCutOpener', 'ExeOpener']

ExeOpener 是一个打开exe文件的功能，如果不设置，则几乎所有应用程序都无法打开

MyComputer 是文件浏览器，我的电脑

AppStore 是应用商店

DataTimeTray 是时间显示托盘图标

BatteryTray 是电池显示托盘图标

ShortCutOpener 是快捷方式打开器

## desktop

系统的初始化的桌面应用。

示例：

```typescript
      {
        name: '测试',
        icon: testicon,
        multiple:false,// 防止多开，默认为true
        order: 3,// 排序 数字越大，越靠后
        window: {
          content: 'https://shimo.im/desktop',// 这里也可以是vue组件
          title: '测试按钮',
          icon: testicon,
          center: true,
          // backgroundColor: "rgba(0,0,0,1)",
        },
      }
```

注意，每次更新桌面的应用时，都需要点击开始菜单的恢复选项。

## magnet

系统的初始化的磁贴应用。

注意，每次更新应用时，都需要点击开始菜单的恢复选项。

## menulist

系统的初始化的开始菜单应用。

注意，每次更新应用时，都需要点击开始菜单的恢复选项。

## fs

系统的文件系统，可以通过传入一个对象来改变系统的文件系统。

默认的文件系统是使用的vtron文件系统，这个文件系统是基于indexedDB的，所以可以持久化保存数据。

如果需要使用自己的文件系统，可以传入一个对象，这个对象需要实现VtronFileInterface接口。

## shell

系统的shell，可以通过传入一个对象来改变系统的shell。

默认的shell是使用的vtron的shell，这个shell本身内置了一些命令，比如ls、cd、mkdir、rm等。可以操作文件系统。

如果需要使用自己的shell，可以传入一个对象，这个对象需要实现ShellInterface接口。

## login

登录的配置项。

login中的init函数，是用来判断是否需要登录，如果返回true，则代表该用户已经登录过，或者已经有了权限，不会跳转到登录页，直接打开系统。

如果返回false，则会跳转到登录页。

在用户输入完用户密码之后，点击登录，会调用loginCallback配置项，这个配置项是一个函数，需要返回一个`Promise<boolean >`，如果返回true，则代表登录成功，否则登录失败。不会打开系统。

init是同步的，可以立即判断是否需要登录

loginCallback是异步的，可以在这里进行登录验证

## noPassword

如果是true，则可以直接点击登录，不需要输入密码。
