<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-09-09 10:12:16
 * @Description: 
 * @FilePath: /myindex/README.md
-->

<h1 align="center">vue3-win10</h1>

<div align="center">

Vue3 仿Win10 UI 框架

</div>

<a href="http://v3w10.myim.online" target="_blank">Document</a>|<a href="http://v3w10.myim.online" target="_blank">Official</a>|<a href="http://myim.online" target="_blank">Demo</a>

<a href="http://v3w10.myim.online" target="_blank">文档</a>|<a href="http://v3w10.myim.online" target="_blank">官网</a>|<a href="http://myim.online" target="_blank">样例</a>

<span style="color:#999;text-align:center">推荐 Vue 3 + Typescript + Vite + Using `<script setup>`
</span>




本框架可以让你的页面像win10视窗系统一样，变为一个网页上的win10系统。

<!-- : [myim.online](http://myim.online) -->
![IMAGE](./rdmassert/open.gif)
![IMAGE](./rdmassert/wintmp.gif)

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

