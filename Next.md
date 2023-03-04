# 整个vue app实例改为只能有一个win实例。
这样考虑是因为通过vue可以控制多个win实例了，就不需要再通过system来控制了。这样也能提高api的调用方便程度。
参考electron的文档，electron的app实例只能有一个。
直接通过app来控制。

Electron 
Proton 
Neutron 

app这种方式不太适合，还是调用system去控制
```js
import { app, BrowserWindow } from 'Magneton'
let win = new BrowserWindow()
const { BrowserWindow } = require('electron')

const win = new BrowserWindow({ width: 800, height: 600 })

// Load a remote URL
win.loadURL('https://github.com')

// Or load a local HTML file
win.loadFile('index.html')

app.whenReady().then(() => {
  createWindow()
})
// Magneton 调用方式：
import { System, BrowserWindow } from 'Magneton'
let system = new System({});
system.whenReady().then(() => {
  system.addApp({
    name: 'app1',
    entry: 'http://localhost:8080'||win,
    window: {
      width: 800,
      height: 600
    }
  });
})

let win = new BrowserWindow({
});

```

# 修改了配置项
改为更加语义化的配置项

# 目录结构

通过再hooks里，通过分类不同的文件夹，来管理不同的功能。这样可以更加清晰的看到不同的功能。
是一种更加充血的模式，摒弃原先的按文件类型去分组。

# 库的调用方式

注册了屏幕组件。Screen。
通过调用Screen组件。将内容显示在vueapp内。
接着调用System类，实例化之后，Screen就会自动显示内容，但是没有实例化的时候，Screen是会呈现黑屏状态的，代表系统没有开机。

# API

## System
```js
import {System} from "Magneton";
let system = new System({
  // 配置项
  // 1. 是否开启调试模式
  debug: true,
  // 2. 是否开启全屏
  fullscreen: true,
});

system.whenReady().then(()=>{
    system.addApp(
        {
            name: 'app1',
            icon: 'http://localhost:8080/favicon.ico',
            entry: 'http://localhost:8080',
        }
    );
    system.addApp(
        [{
            entry: win,
        }]
    );
},(err)=>{

});

```

## BrowserWindow
```js
import {BrowserWindow} from "Magneton";
let win = new BrowserWindow({
    width: 800,
    height: 600,
    // 是否开启调试模式
    debug: true,
    // 是否开启全屏
    fullscreen: true,
    // 是否开启最大化
    maximizable: true,
    // 是否开启最小化
    minimizable: true,
    // 是否开启关闭
    closable: true,
    // 是否开启缩放
    resizable: true,
    // 是否开启拖拽
    movable: true,
    // 是否开启透明
    transparent: true,
    // 是否开启阴影
    hasShadow: true,
    // 是否开启总是置顶
    alwaysOnTop: true,
    // 是否开启无边框
    frame: true,
    // 是否开启菜单栏
    menu: true,
    // 是否开启任务栏
    taskbar: true,
});
```