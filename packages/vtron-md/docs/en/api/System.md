# System
## useSystem

整个vue应用只能有一个system，所以这个方法用来获取当前的system

there is only one system in vue app, so this method is used to get current system

usage:

```typescript
import { useSystem } from "vtron";
const system = useSystem();
```

## constructor

```typescript
interface SystemOptions {
    logo?:string;
    background?:string;
    desktop?:WinAppOptions[];
    magnet?:WinAppOptions[];
    menulist?:WinAppOptions[];
}
constructor(options?: SystemOptions)
```
logo：可以设置系统的logo，如果不设置则使用默认的logo

### Usage

```typescript
import { System } from "vtron";
const system = new System({
    //...options
});
```

## whenReady

```typescript
whenReady(): Promise<System>
```
只有在系统准备之后，才能对system进行操作，如添加app到桌面

only after system ready, you can add app to desktop and so on

Usage:

```typescript
import { System } from "vtron";
const system = new System();

system.whenReady().then((system)=>{
    //...
})
```


## fs

是当前系统的文件系统，其中有一些方法可以用来操作文件系统

it is the file system of current system, there are some methods to operate file system

其他内容详见本文档的api/fs 部分

see api/fs for more

### Usage

```typescript
import { useSystem } from "vtron";
const system = useSystem();
system.fs.readFile("path/to/file").then((data)=>{

})
```

## emitEvent

在系统中提交一个事件

emit an event in system

系统中定义了一些内置的事件，可以提交事件来触发，例如打开右键菜单，详见本文档的api/event 部分

there are some built-in events in system, you can emit event to trigger, for example, open context menu, see api/event for more

```typescript
import { useSystem } from "vtron";
const system = useSystem();
system.emitEvent(event: string, ...args: any[])
```

## mountEvent

在系统中监听一个事件

listen an event in system

系统中定义了一些内置的事件，可以监听事件来触发，例如打开右键菜单，详见本文档的api/event 部分

there are some built-in events in system, you can listen event to trigger, for example, open context menu, see api/event for more

```typescript
import { useSystem } from "vtron";
const system = useSystem();
system.mountEvent(event: string, callback: (...args: any[]) => void)
```

## registerFileOpener

注册一个文件打开器，当系统中有对应类型的文件被打开时，会调用这个打开器

register a file opener, when system open a file with this type, this opener will be called

其他内容详见本文档的api/fs 部分

see api/fs for more

```typescript
import { useSystem，BrowserWindow } from "vtron";
const system = useSystem();
system.registerFileOpener("text/plain",(path,content)=>{
    let pdfwindow = new BrowserWindow({
        width: 400,
        height: 400,
        icon: mycomicon,
        center: true,
        title:'文本文档',
        content: TextViewer,
        config:{
            content:content,
            path:path
        }
    });
    pdfwindow.show()
})
```
## openFile

打开一个文件，会调用对应类型的文件打开器

open a file, will call the opener with this type

其他内容详见本文档的api/fs 部分

see api/fs for more

```typescript
import { useSystem } from "vtron";
const system = useSystem();
system.openFile("path/to/file")
```

## use

为system添加一个插件，插件可以为system添加一些功能

add a plugin to system, plugin can add some features to system

vtron 提供了插件扩展能力，可以通过插件扩展系统的功能，当然，我们也开发了一些插件来提供一些基础的额外功能，vtron-plus就是其中之一。

vtron provide plugin system, you can add some features to system by plugin, of course, we also develop some plugins to provide some basic features, vtron-plus is one of them.

关于vtron-plus的内容详见本文档的vtron-plus 部分

see vtron-plus for more

```typescript
import { useSystem } from "vtron";
const system = useSystem();
system.use(plugin: (system: System, rootState: RootState) => void)
```

## addApp

after system ready, add app to desktop

在系统准备完毕之后，添加app到桌面图标

```typescript
addApp(options:Partial<WinApp>)

interface WinApp {
    name?:string;
    icon?:string;
    url?:string;
    window?: BrowserWindow
}
```

Usage:

```typescript
import { System } from "vtron";
const system = new System();
system.whenReady().then((readySystem)=>{
    readySystem.addApp({
        name:"string";
        icon:"string";
        window:new BrowserWindow(
            //...
        )
    })
})
```
## addMagnet

add app to Magnet

添加app到磁贴

usage same as addApp

用法同 addApp

## addMenuList

add app to MenuList

添加app到菜单栏

usage same as addApp

用法同 addApp

## shutdown

```typescript
shutdown()
```
关闭系统，屏幕会黑屏，只有刷新页面才能重新打开

shutdown system, screen will be black, you can only refresh page to open system again

Usage:

```typescript
import { System } from "vtron";
const system = new System();

system.shutdown();
```

## reboot

```typescript
reboot()
```

恢复系统，恢复的过程是：清除本地的localStorage，清楚本地的文件系统。

reboot system, the process is: clear localStorage, clear file system.

Usage:

```typescript
import { System } from "vtron";
const system = new System();

system.reboot();
```

