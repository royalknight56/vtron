<!--
 * @Author: Royal
 * @LastEditTime: 2022-04-26 15:08:12
 * @Description: 
 * @FilePath: /myindex/README.md
-->

<h1 align="center">vue3-win10</h1>

<div align="center">

Vue3 仿Win10 UI 框架

</div>

<div align="center">

<a href="http://v3w10.myim.online" target="_blank">文档</a>|<a href="http://v3w10.myim.online" target="_blank">官网</a>|<a href="http://myim.online" target="_blank">样例</a>

</div>

<span style="color:#999;text-align:center">推荐 Vue 3 + Typescript + Vite + Using `<script setup>`
</span>

<span style="color:#999;text-align:center">
样例代码：https://github.com/royalknight56/vue3-windows10-demo
</span>


本框架可以让你的页面像win10视窗系统一样，变为一个网页上的win10系统。

<!-- : [myim.online](http://myim.online) -->
![IMAGE](./rdmassert/open.gif)
<!-- ![IMAGE](./rdmassert/wintmp.gif) -->

# Usage

## 开发流程


1. 安装vue3-win10

> npm install vue3-win10

2. 在vue中use插件

通过'vue3-win10'引入插件
```js
import win10 from 'vue3-win10';
```
引入样式文件"vue3-win10/distlib/style.css"

```js
import "vue3-win10/distlib/style.css"
```

use

```js
import { createApp } from 'vue'
import App from './App.vue'
import win10 from 'vue3-win10';
import "vue3-win10/distlib/style.css"

createApp(App).use(win10).mount('#app')
```


3. 在页面中引入Win10租组件
 
```html
<Win10></Win10>
```

此步骤之后，run dev已经可以看到win10启动了

4. 控制屏幕🖥大小

在组件外围包裹一个outer

```html
  <div class="outer">
    <Win10></Win10>
  </div>
```
定义outer样式
  
```html
<style scoped>
.outer {
  width: 100vw;
  height: 100vh;
}
</style>
```
这样就是占据全部页面显示


4. 在apps文件夹下新建vue文件，主要在此文件夹中编写窗口内容（非必须）

# 感谢Star

欢迎PR，意见，想法，感谢各位大佬的支持

![](https://komarev.com/ghpvc/?username=royalknight56&color=blue)



# 目录
```
|-- packages
    |-- appconfig.ts  // APP的配置
    |-- init.ts       // 初始化过程
    |-- main.css      // 全局css
    |-- Win.vue       // Win10组件
    |-- window        // Win10逻辑
        |-- builtin     // 内建的页面，设置等
        |   |-- appInfo.vue
        |   |-- callSystemWins.ts
        |   |-- systemSet.vue
        |   |-- setApps
        |   |   |-- setStyle.scss
        |   |   |-- SetSystemset.vue
        |   |   |-- SetVersion.vue
        |   |-- winComponent
        |       |-- WinButton.vue
        |       |-- WinCheckBox.vue
        |       |-- WinRadio.vue
        |       |-- WinSelect.vue
        |-- libs        // 主要依赖
        |   |-- GlobalOps.ts
        |   |-- ContextMenu.ts
        |   |-- Notify.ts
        |   |-- SystemState.ts
        |   |-- WindowTmp.vue
        |   |-- Dom             // Dom操作
        |   |   |-- DragElement.ts
        |   |   |-- ScaleElement.ts
        |   |-- DragWindow      // 窗口
        |   |   |-- index.ts
        |   |   |-- option.ts
        |   |-- DWM             // 窗口管理中心
        |   |   |-- DWM.ts
        |   |   |-- index.ts
        |   |   |-- PrivateDWM.ts
        |   |   |-- type.ts
        |   |-- WindowTemplate  // 窗口模板
        |       |-- getCom.ts
        |       |-- statebarButton.vue
        |       |-- windowInner.vue
        |       |-- defaultInner
        |           |-- error.vue
        |           |-- loadding.vue
        |-- state       // 集中状态管理
        |   |-- index.ts
        |   |-- listener.ts
        |   |-- type.ts
        |-- structure   // Win所必需的结构
            |-- Alert.vue
            |-- ContextMenu.vue
            |-- Desktop.vue
            |-- DragWindow.vue
            |-- LockScreen.vue
            |-- Magnet.vue
            |-- TaskBar.vue
            |-- WindowsGroup.vue
            |-- background
            |   |-- default.vue
            |   |-- imgbackground.vue
            |   |-- index.vue
            |-- status
            |   |-- black.vue
            |   |-- blue.vue
            |   |-- index.vue
            |-- taskbarIcon
                |-- charging.vue
                |-- network.vue

```
