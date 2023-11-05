# 常见问题

## 为什么在 system 中添加了 app，桌面还是没有显示出 app

桌面的图标都是在用户的文件系统中保存的

Vtron 只有在系统第一次启动的时候，才会在文件系统中添加 app 图标

所以，这时需要点击开始菜单->电源->恢复

恢复之后，系统会回到第一次启动的状态，这时，会执行一些特殊的过程，比如在桌面添加 app 图标

## 怎么使用 vtron-plus

vtron-plus 是 vtron 的插件系统，可以通过 vtron-plus 来扩展 vtron 的功能

尝试在 ready 之后，再去访问 system 的属性。

```js
import { System } from "vtron";
import { vtronPlus } from "vtron-plus";
let system = new System({});
system.whenReady().then(() => {
  // 在这里访问system的属性
  system.use(VtronPlus);
});
```

## Screen 是什么

Screen 是用来显示系统状态的，现在已经改为整个 vue 实例只有一个 system 类型，所以，在这个 vue 实例中的 system 的状态，都会展示在 screen 组件中。

## 为什么创建了 BrowserWindow，但是没有显示出来

创建 BrowserWindow 后，需要调用 BrowserWindow 的 show 方法，才会显示出来。

## 为什么访问不了 system 的一些属性

system 需要在 ready 之后，所有的功能才能生效。

尝试在 ready 之后，再去访问 system 的属性。

使用 system 的 whenReady 方法，

```js
system.whenReady().then(() => {
  // 在这里访问system的属性
});
```

## 怎么调用右键菜单

详见 api/event/contextMenu.show

通过手动触发 contextMenu 事件，传入鼠标事件，和自定义菜单，触发右键菜单。

## 怎么在窗口内部获取 browserWindow 实例

通过 inject 注入 browserWindow 实例

```ts
import { BrowserWindow } from "vtron";
let browserWindow = inject<BrowserWindow>("browserWindow");
```

## 怎么访问系统文件

使用文件系统，详见 api/fs

## exe 文件是什么格式

exe 文件可以直接调用保存的窗口创建函数

格式如下：

// content: `link:${loc}:${options.name}:${options.icon?.length}:${options.icon}`

## url 文件是什么格式

url 文件打开后会直接显示设定的 url

格式如下

// content: `link::${options.link}::icon::${options.icon}`

## 怎么让无边框窗口可以拖动

在无边框窗口内部，无边框窗体的拖动把手，可以通过设置 `vDragable` 指令来使得某一元素成为拖动把手。就可以让窗口可以拖动了。

```vue
<div v-dragable>拖动把手</div>

import { vDragable } from 'vtron';
```

## 是否可以使用 win 样式的组件

可以，我们导出了一些已经封装好的组件

可以从 vtron 中导入：
WinButtonVue,WinSelect,WinInput

## 系统恢复是什么意思

恢复是指清空 localStorage，和 indexeddb（即文件系统）。

系统会被标记为 isFirstRun。

## 文件系统是怎么实现的

是通过 indexeddb 实现的，详见 api/fs，所以，一般的刷新不会清空文件系统，想要修复文件系统，可以使用恢复系统。

## 为什么窗口内容传入 url，打不开，页面是错误

因为有的网站开启了 x-frame-options，所以，无法在 iframe 中打开。
