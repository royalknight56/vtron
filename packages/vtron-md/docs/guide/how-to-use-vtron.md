# 怎么使用 Vtron

<p align="center"><a href="https://vtron.site" target="_blank" rel="noopener noreferrer"><img width="200" src="./vtron-logo-nobg.png" alt="vtron logo"></a></p>

<div align="center">

vtron, 基于 Vue3 的 Win10 UI 框架

</div>

<div align="center">

<a href="http://v3w10.vtron.site" target="_blank">文档</a>|<a href="http://v3w10.vtron.site" target="_blank">官网</a>|<a href="http://vtron.site" target="_blank">样例</a>

</div>

<span style="color:#999;text-align:center">推荐 Vue 3 + Typescript + Vite + Using `<script setup>`
</span>

本框架可以让你的页面像 win10 视窗系统一样，运行一个网页上的 win10 系统。

## 开发流程

### 使用 Github 模版

1. 创建项目
   https://github.com/royalknight56/vtron-template

从这个模版仓库创建新的项目。

2. clone 项目

git clone 已经创建好的项目

3. 修改 apps 目录下的文件，或者新建 app

### 使用 npm，从创建好的 vue 项目开始

1. 安装 vtron

> npm install vtron

2. 在 vue 中 use 插件

```js
import vtron from 'vtron';
```

引入样式文件"vtron/distlib/style.css"

```js
import 'vtron/distlib/style.css';
```

使用案例

```js
import { createApp } from 'vue';
import App from './App.vue';
import vtron from 'vtron';
import 'vtron/distlib/style.css';

createApp(App).use(vtron).mount('#app');
```

3. 在页面中引入 Screen 组件

首先，我们需要创建一个 system 对象，这个对象管理着系统的所有状态信息。

```vue
// App.vue
<Screen></Screen>
<script setup>
import { System } from 'vtron';
let system = new System();
</script>
```

此步骤之后，run dev 已经可以看到 win10 启动了

4. 控制屏幕 🖥 大小

在组件外围包裹一个 outer

```vue
<div class="outer">
    <Screen></Screen>
  </div>
```

定义 outer 样式

```html
<style scoped>
  .outer {
    width: 100vw;
    height: 100vh;
  }
</style>
```

这样就是占据全部页面显示

4. 在 apps 文件夹下新建 vue 文件，主要在此文件夹中编写窗口内容（非必须）

```vue
<template>
  <div class="app">
    <h1>HelloWorld</h1>
  </div>
</template>
```

5. 在 system 中注册 app

在 system 的构造函数传入配置项，

其中 desktop 是桌面的配置项，可以配置多个 app

> 注意!

> 需要点击开始菜单中的电源按钮，再点击恢复，才能看到 app

注册之后，需要点击开始菜单中的电源按钮，再点击恢复，才能看到 app

这样是为了使得系统重回第一次启动的状态，这样 vtron 才会在桌面重新添加图标

```vue
<Screen></Screen>
<script setup>
import { System, BrowserWindow } from 'vtron';
import { App } from './apps/App.vue';
import someicon from './assets/someicon.png';
import HelloWorld from './apps/HelloWorld.vue';
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
</script>
```

6. 窗口中的操作

下面是包含了部分api操作的示例

```vue
<template>
  <div class="outer">
    {{ sys?.version }}
  </div>
</template>
<script lang="ts" setup>
import { Notify, BrowserWindow, useSystem } from 'vtron';
import { onUnmounted, inject } from 'vue';
// 通过inject导入本窗口的信息
const browserWindow: BrowserWindow = inject('browserWindow') as BrowserWindow;
// 通过useSystem 获取到系统的信息
const sys = useSystem();

// 获取本地保存的md文件 sys._rootState.options.userLocation 是用户的文件系统路径
sys.fs.readFile(join(sys._rootState.options.userLocation || '', '/Note/test.md')).then((res) => {
  console.log(res);
});

// 监听窗口的部分事件
browserWindow.on('move', (...arg: any) => {
  console.log('move', arg);
});
browserWindow.on('resize', (...arg: any) => {
  console.log('resize', arg);
});
browserWindow.on('state', (...arg: any) => {
  console.log('state', arg);
});

function nextStep(fun: () => void, time?: number) {
  return new Promise((resolve) => {
    const res = fun();
    setTimeout(() => {
      resolve(res);
    }, time || 50);
  });
}
await nextStep(() => {
  // 获取窗口的位置大小
  const [x, y] = browserWindow.getPosition();
  const [width, height] = browserWindow.getSize();
  // 调用系统提示
  new Notify({
    title: 'title',
    content: `${x},${y},${width},${height}`,
    timeout: 5000,
  });
}, 100);
await nextStep(() => {
  // 设置窗口的位置大小
  browserWindow.setPosition(100, 100);
  browserWindow.setSize(500, 500);
}, 100);

await nextStep(() => {
  // 将窗口居中
  browserWindow.center();
}, 100);

await nextStep(() => {
  const title = browserWindow.getTitle();
  browserWindow.setTitle('新标题');
}, 100);
await nextStep(() => {
  // 窗口最大化
  browserWindow.maximize();
}, 200);
await nextStep(() => {
  // 恢复窗口状态
  browserWindow.restore();
}, 100);
await nextStep(() => {
  // 窗口最小化
  browserWindow.minimize();
}, 200);
await nextStep(() => {
  browserWindow.restore();
}, 100);

await nextStep(() => {
  browserWindow.setFullScreen(true);
}, 100);
await nextStep(() => {
  browserWindow.setFullScreen(false);
}, 100);
</script>
```

## 常见问题

为什么在 system 中添加了 app，桌面还是没有显示出 app

桌面的图标都是在用户的文件系统中保存的

Vtron 只有在系统第一次启动的时候，才会在文件系统中添加 app 图标

所以，这时需要点击开始菜单->电源->恢复

恢复之后，系统会回到第一次启动的状态，这时，会执行一些特殊的过程，比如在桌面添加 app 图标

# 感谢 Star

欢迎 PR，意见，想法，感谢各位大佬的支持

![](https://komarev.com/ghpvc/?username=royalknight56&color=blue)

## Thanks
