# 怎么使用 Vtron

<p align="center"><a href="https://myim.online" target="_blank" rel="noopener noreferrer"><img width="200" src="./vtron-logo-nobg.png" alt="vtron logo"></a></p>

<div align="center">

vtron, 基于 Vue3 的 Win10 UI 框架

</div>

<div align="center">

<a href="http://v3w10.myim.online" target="_blank">文档</a>|<a href="http://v3w10.myim.online" target="_blank">官网</a>|<a href="http://myim.online" target="_blank">样例</a>

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
import vtron from "vtron";
```

引入样式文件"vtron/distlib/style.css"

```js
import "vtron/distlib/style.css";
```

使用案例

```js
import { createApp } from "vue";
import App from "./App.vue";
import vtron from "vtron";
import "vtron/distlib/style.css";

createApp(App).use(vtron).mount("#app");
```

3. 在页面中引入 Screen 组件

首先，我们需要创建一个 system 对象，这个对象管理着系统的所有状态信息。

```vue
// App.vue
<Screen></Screen>
<script setup>
import { System } from "vtron";
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
import { System, BrowserWindow } from "vtron";
import { App } from "./apps/App.vue";
import someicon from "./assets/someicon.png";
import HelloWorld from "./apps/HelloWorld.vue";
let system = new System({
  desktop: [
    {
      name: "HelloWorld",
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

# 感谢 Star

欢迎 PR，意见，想法，感谢各位大佬的支持

![](https://komarev.com/ghpvc/?username=royalknight56&color=blue)

## Thanks
