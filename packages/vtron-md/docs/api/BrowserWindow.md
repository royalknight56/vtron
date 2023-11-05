# BrowserWindow

创建一个窗口，窗口可以通过不同的配置实现不同的风格，样式，内容

在创建窗口时，一般要传入窗口的内容，是一个 vue 组件，将 vue 组件引入之后，直接传递给创建窗口的参数，之后使用窗口的 show 方法，会将引入的 vue 文件作为窗口的内容，显示在窗口中

## 在窗口内容中获取 browserWindow

通过 inject 注入 browserWindow 实例

```ts
import { BrowserWindow } from "vtron";
let browserWindow = inject<BrowserWindow>("browserWindow");
```

## constructor

type:

```ts
constructor(option:{
    title: string
    content:  ReturnType<typeof defineComponent> | string,
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
})
```

BrowserWindow 是 vtron 中创建窗口的类，它可以通过传入不同的构建参数来定制化窗口的外观和行为。在本文档中，我们将介绍 BrowserWindow 构建参数的各个属性和用法，以便您更好地了解如何使用它们来创建您的自定义窗口。

```ts
import ContentVue from "./content.vue";
const win = new BrowserWindow({
  title: "test",
  content: ContentVue,
  icon: "test",
  width: 100,
  height: 100,
  x: 100,
  y: 100,
  center: true,
  resizable: true,
});
```

## constructor option

option 对象包含 BrowserWindow 构建参数的各个属性。以下是这些属性的详细说明。

### title

Type: string

窗口的标题。

### content

Type: ReturnType < typeof defineComponent > | string

窗口显示的内容。可以传入一个 Vue 组件或者一个网址。

### config

Type: any

窗口的配置对象。这个对象会被传递给窗口渲染进程，可以在窗口内部使用。

### icon

Type: string

窗口的图标路径。

### width

Type: number

窗口的宽度，以像素为单位。

### height

Type: number

窗口的高度，以像素为单位。

### x

Type: number

窗口的横坐标，以像素为单位。

### y

Type: number

窗口的纵坐标，以像素为单位。

### center

Type: boolean

是否将窗口居中显示。

### resizable

Type: boolean

窗口是否可以调整大小。

### frame

Type: boolean

是否显示窗口边框。

### fullscreen

Type: boolean

窗口是否全屏显示。

### minimizable

Type: boolean

窗口是否可以最小化。

### alwaysOnTop

Type: boolean

窗口是否总在顶部显示。

### skipTaskbar

Type: boolean

是否在任务栏中隐藏窗口。

### backgroundColor

Type: string

窗口的背景颜色。

## id

type:

```ts
id: number;
```

The id of the window.

usage:

```ts
const win = new BrowserWindow();
console.log(win.id);
```

## show

type:

```ts
show():void
```

显示窗口，调用这个方法后，窗口会显示在桌面上

usage:

```ts
const win = new BrowserWindow();
win.show();
```

## close

type:

```ts
close():void
```

Close the window.

usage:

```ts
const win = new BrowserWindow();
win.close();
```

## destroy

type:

```ts
destroy():void
```

Destroy the window.

usage:

```ts
const win = new BrowserWindow();
win.destroy();
```

## on

监听一个事件

```ts
on(event: string, callback: Function)
```

目前可以监听以下事件

show: 窗口打开时触发

close: 窗口关闭时触发

resize: 窗口缩放时

move: 窗口移动时

state: 窗口状态改变时

    minimize: 窗口最小化时

    maximize: 窗口最大化时

    unmaximize: 窗口取消最大化时

    close: 窗口关闭时

## emit

触发一个事件

```ts
emit(event: string, ...args: any[])
```

## isDisable

type:

```ts
isDisable():boolean
```

返回窗口是否被禁用

窗口被禁用时，无法点击，无法拖动

usage:

```ts
const win = new BrowserWindow();
console.log(win.isDisable());
```

## isVisible

type:

```ts
isVisible():boolean
```

返回窗口是否可视

usage:

```ts
const win = new BrowserWindow();
console.log(win.isVisible());
```

## isDestroyed

type:

```ts
isDestroyed():boolean
```

返回窗口是否已经被销毁

usage:

```ts
const win = new BrowserWindow();
console.log(win.isDestroyed());
```

## isMaximized

type:

```ts
isMaximized():boolean
```

返回窗口是否最大化

usage:

```ts
const win = new BrowserWindow();
console.log(win.isMaximized());
```

## isMaximizable

type:

```ts
isMaximizable():boolean
```

返回窗口是否可以最大化

usage:

```ts
const win = new BrowserWindow();
console.log(win.isMaximizable());
```

## isMinimized

type:

```ts
isMinimized():boolean
```

返回窗口是否最小化

usage:

```ts
const win = new BrowserWindow();
console.log(win.isMinimized());
```

## isMinimizable

type:

```ts
isMinimizable():boolean
```

返回窗口是否可以最小化

usage:

```ts
const win = new BrowserWindow();
console.log(win.isMinimizable());
```

## isNormal

type:

```ts
isNormal():boolean
```

返回窗口是否处于正常状态，即不是最大化或最小化

usage:

```ts
const win = new BrowserWindow();
console.log(win.isNormal());
```

## isResizable

type:

```ts
isResizable():boolean
```

返回窗口是否可以调整大小

usage:

```ts
const win = new BrowserWindow();
console.log(win.isResizable());
```

## isFullScreen

type:

```ts
isFullScreen():boolean
```

返回窗口是否全屏

usage:

```ts
const win = new BrowserWindow();
console.log(win.isFullScreen());
```

## center

type:

```ts
center():void
```

把窗口移动到屏幕中心

usage:

```ts
const win = new BrowserWindow();
win.center();
```

## restore

type:

```ts
restore():void
```

把窗口从最小化状态恢复到之前的状态

usage:

```ts
const win = new BrowserWindow();
win.restore();
```

## getSize

type:

```ts
getSize():[number,number]
```

返回窗口的大小

usage:

```ts
const win = new BrowserWindow();
console.log(win.getSize());
```

## getTitle

type:

```ts
getTitle():string
```

返回窗口的标题

usage:

```ts
const win = new BrowserWindow();
console.log(win.getTitle());
```

## getPosition

type:

```ts
getPosition():[number,number]
```

返回窗口的位置

usage:

```ts
const win = new BrowserWindow();
console.log(win.getPosition());
```

## maximize

type:

```ts
maximize():void
```

最大化窗口

usage:

```ts
const win = new BrowserWindow();
win.maximize();
```

## minimize

type:

```ts
minimize():void
```

最小化窗口

usage:

```ts
const win = new BrowserWindow();
win.minimize();
```

## setSize

type:

```ts
setSize(width:number,height:number):void
```

设置窗口的大小

usage:

```ts
const win = new BrowserWindow();
win.setSize(100, 100);
```

## setTitle

type:

```ts
setTitle(title:string):void
```

设置窗口的标题

usage:

```ts
const win = new BrowserWindow();
win.setTitle("title");
```

## setPosition

type:

```ts
setPosition(x:number,y:number):void
```

设置窗口的位置

usage:

```ts
const win = new BrowserWindow();
win.setPosition(100, 100);
```

## setDisable

type:

```ts
setDisable(disable:boolean):void
```

设置窗口是否禁用

窗口被禁用时，无法点击，无法拖动

## setResizable

type:

```ts
setResizable(resizable:boolean):void
```

设置窗口是否可以调整大小

usage:

```ts
const win = new BrowserWindow();
win.setResizable(true);
```

## setMaximizable

type:

```ts
setMaximizable(maximizable:boolean):void
```

设置窗口是否可以最大化

usage:

```ts
const win = new BrowserWindow();
win.setMaximizable(true);
```

## setMinimizable

type:

```ts
setMinimizable(minimizable:boolean):void
```

设置窗口是否可以最小化

usage:

```ts
const win = new BrowserWindow();
win.setMinimizable(true);
```
