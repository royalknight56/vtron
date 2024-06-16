# 怎么使用 Vtron

<p align="center"><a href="https://vtron.site" target="_blank" rel="noopener noreferrer"><img width="200" src="./vtron-logo-nobg.png" alt="vtron logo"></a></p>

<div align="center">

vtron, 基于 Vue3 的 Win10 UI 框架

</div>

<div align="center">

<a href="https://vtron.site/doc" target="_blank">文档</a>|<a href="https://vtron.site/doc" target="_blank">官网</a>|<a href="http://vtron.site" target="_blank">样例</a>

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

2. 在 vue 中 引入样式文件

引入样式文件"vtron/distlib/style.css"

```js
import 'vtron/distlib/style.css';
```

main.ts 结果

```js
import { createApp } from 'vue';
import App from './App.vue';
import 'vtron/distlib/style.css';

createApp(App).mount('#app');
```

  注意⚠️：0.7版本不需要再use Vtron插件


3. 在页面中引入`VtronComputer`组件和创建`System`实例

我们需要创建一个 `System` 实例，这个实例管理着系统的所有状态信息。

并且需要在vue组件模版中写入`VtronComputer`组件

将new出来的`System`实例传入到`VtronComputer`组件的`system`参数中

```vue
// App.vue
<template>
  <div class="outer">
    <VtronComputer :system="system"></VtronComputer>
  </div>
</template>
<script setup>
import { System，VtronComputer} from 'vtron';
let system = new System();
</script>
```

此步骤之后，run dev 已经可以看到 win10 启动了

4. 控制屏幕 🖥 大小

在组件外围包裹一个 outer

```vue
<template>
  <div class="outer">
    <VtronComputer :system="system"></VtronComputer>
  </div>
</template>
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

4. 在 apps 文件夹下新建 vue 文件，主要在此文件夹中编写窗口内容

也可以在其他文件夹下，

这次，我们创建一个`Hello.vue`文件，

```vue
// Hello.vue
<template>
  <div class="app">
    <h1>HelloWorld</h1>
  </div>
</template>
```

5. 在 system 中注册 app

在 system 的构造函数传入配置项，

其中 desktop 是桌面的配置项，可以配置多个 app

配置之后，软件的图标，快捷方式会显示在桌面上

> 注意!

> 需要点击开始菜单中的电源按钮，再点击恢复，才能看到 app

注册之后，需要点击开始菜单中的电源按钮，再点击恢复，才能看到 app

这样是为了使得系统重回第一次启动的状态，这样 vtron 才会在桌面重新添加图标

```vue
<script setup>
import { System } from 'vtron';
import HelloVue from './apps/Hello.vue';
import someicon from './assets/someicon.png';
let system = new System({
  desktop: [
    {
      name: 'HelloVue',
      icon: someicon,
      window: {
        content: HelloVue,
        icon: someicon,
      },
    },
  ],
});
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

欢迎加入技术交流qq群： 712921211