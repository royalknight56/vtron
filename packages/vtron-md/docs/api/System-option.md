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
  lang?: string;
  logo?: string;
  background?: string;
  rootStyle?: any;
  builtinApp?: BuiltinApp[];
  desktop?: WinAppOptions[];
  magnet?: WinAppOptions[];
  menulist?: WinAppOptions[];
  fs?: VtronFileInterface;
  userLocation?: string;
  systemLocation?: string;
  initFile?: InitFileItem;
  shell?: ShellInterface;
  login?: {
    username: string;
    password: string;
    init?: () => boolean;
  };
  contextMenus?: {
    name: string;
    click: () => void;
  }[];
  noPassword?: boolean;
  loginCallback?: (username: string, password: string) => Promise<boolean>;
}

export interface WinAppOptions {
    name:string;
    icon?:string;
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

## lang

系统的语言，目前支持中文和英文

支持的值：'zh-CN' | 'en-US'

## logo

系统左下角的 logo

默认是win10的logo，传入字符串改变

## background

系统的背景图

默认是win10的背景图，传入字符串改变

## builtinApp

系统内置的app，可以通过数组设置是否显示

type BuiltinApp = 'MyComputer' | 'AppStore';

目前只支持 我的电脑 和 应用商店

默认值是 ['MyComputer', 'AppStore']

## desktop

系统的初始化的桌面应用。

示例：

```typescript
      {
        name: '测试',
        icon: testicon,
        multiple:false,// 防止多开，默认为true
        window: {
          content: 'https://shimo.im/desktop',// 这里也可以是vue组件
          title: '测试按钮',
          icon: testicon,
          center: true,
          // backgroundColor: "rgba(0,0,0,1)",
        },
      }
```

## magnet

系统的初始化的磁贴应用。

## menulist

系统的初始化的开始菜单应用。

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

## noPassword

如果是true，则可以直接点击登录，不需要输入密码。
