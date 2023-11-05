# BrowserWindow

## constructor

type:
    
```ts
constructor(option:{
    title: string;
    content: ReturnType<typeof defineComponent> | string,
    config?: any;
    icon: string;
    width: number;
    height: number;
    x: number;
    y: number;
    center: boolean;
    resizable: boolean;
    frame: boolean;
    fullscreen: boolean;
    minimizable: boolean;
    alwaysOnTop: boolean;
    skipTaskbar: boolean;
    backgroundColor: string;
})
```


BrowserWindow 是 vtron 中创建窗口的类，它可以通过传入不同的构建参数来定制化窗口的外观和行为。在本文档中，我们将介绍 BrowserWindow 构建参数的各个属性和用法，以便您更好地了解如何使用它们来创建您的自定义窗口。

```ts
import ContentVue from './content.vue'
const win = new BrowserWindow({
    title: 'test',
    content: ContentVue,
    icon: 'test',
    width: 100,
    height: 100,
    x: 100,
    y: 100,
    center: true,
    resizable: true
})

```

## option 

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
id:number
```

The id of the window.

usage:

```ts
const win = new BrowserWindow();
console.log(win.id);
```

## content

type:
    
```ts
content:ReturnType<typeof defineComponent> | string
```

The content of the window.

usage:

```ts
const win = new BrowserWindow();

```


## show

type:
    
```ts
show():void
```

Show the window.

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

## isVisible

type:
    
```ts
isVisible():boolean
```

Returns whether the window is visible to the user.

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

Returns whether the window has been destroyed.

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

Returns whether the window is maximized.

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

Returns whether the window is maximizable.

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

Returns whether the window is minimized.

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

Returns whether the window is minimizable.

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

Returns whether the window is in normal state.

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

Returns whether the window is resizable.

usage:

```ts
const win = new BrowserWindow();
console.log(win.isResizable());
```

## center

type:
    
```ts
center():void
```

Moves window to the center of the screen.

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

Restores the window from minimized state to its previous state.

usage:

```ts
const win = new BrowserWindow();
win.restore();
```

## setSize

type:
    
```ts
setSize(width:number,height:number):void
```

Sets the window's size.

usage:

```ts
const win = new BrowserWindow();
win.setSize(100,100);
```

## getSize

type:
    
```ts
getSize():[number,number]
```

Returns the window's size.

usage:

```ts
const win = new BrowserWindow();
console.log(win.getSize());
```

## setTitle

type:
    
```ts
setTitle(title:string):void
```

Sets the window's title.

usage:

```ts
const win = new BrowserWindow();
win.setTitle('title');
```

## getTitle

type:
    
```ts
getTitle():string
```

Returns the window's title.

usage:

```ts
const win = new BrowserWindow();
console.log(win.getTitle());
```

## setPosition

type:
    
```ts
setPosition(x:number,y:number):void
```

Sets the window's position.

usage:

```ts
const win = new BrowserWindow();
win.setPosition(100,100);
```

## getPosition

type:
    
```ts
getPosition():[number,number]
```

Returns the window's position.

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

Maximizes the window.

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

Minimizes the window.

usage:

```ts
const win = new BrowserWindow();
win.minimize();
```

## setResizable

type:
    
```ts
setResizable(resizable:boolean):void
```

Sets whether the window is resizable.

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

Sets whether the window is maximizable.

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

Sets whether the window is minimizable.

usage:

```ts
const win = new BrowserWindow();
win.setMinimizable(true);
```



