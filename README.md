<!--
 * @Author: Royal
 * @LastEditTime: 2022-04-26 15:08:12
 * @Description: 
 * @FilePath: /myindex/README.md
-->

<p align="center"><a href="https://myim.online" target="_blank" rel="noopener noreferrer"><img width="200" src="./rdmassert/vtron-logo.png" alt="vtron logo"></a></p>

<div align="center">

vtron, 基于Vue3 Win10 UI 框架

</div>

<div align="center">

<a href="http://v3w10.myim.online" target="_blank">文档</a>|<a href="http://v3w10.myim.online" target="_blank">官网</a>|<a href="http://myim.online" target="_blank">样例</a>

</div>

<span style="color:#999;text-align:center">推荐 Vue 3 + Typescript + Vite + Using `<script setup>`
</span>

<!-- <span style="color:#999;text-align:center">
样例代码：https://github.com/royalknight56/vue3-windows10-demo
</span> -->


本框架可以让你的页面像win10视窗系统一样，运行一个网页上的win10系统。

![IMAGE](./rdmassert/open.gif)

# Usage

## 开发流程


1. 安装vtron

> npm install vtron

2. 在vue中use插件

通过'vtron'引入插件
```js
import vtron from 'vtron';
```
引入样式文件"vtron/distlib/style.css"

```js
import "vtron/distlib/style.css"
```

use

```js
import { createApp } from 'vue'
import App from './App.vue'
import vtron from 'vtron';
import "vtron/distlib/style.css"

createApp(App).use(vtron).mount('#app')
```


3. 在页面中引入Screen组件

首先，我们需要创建一个system对象，这个对象管理着系统的所有状态信息。


```vue
// App.vue
<Screen></Screen>
<script setup>
import { System } from "vtron";
let system = new System();
</script>
```

此步骤之后，run dev已经可以看到win10启动了

4. 控制屏幕🖥大小

在组件外围包裹一个outer

```sue
  <div class="outer">
    <Screen></Screen>
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

5. 在system中注册app

```vue
<Screen></Screen>
<script setup>
import { System } from "vtron";
import { App } from "./apps/App.vue";
import someicon from "./assets/someicon.png";
import HelloWorld from "./apps/HelloWorld.vue";
let system = new System();
system.addApp({
  name: 'HelloWorld',
  icon: someicon,
  window: new BrowserWindow({
    content:HelloWorld,
    icon: someicon,
  })
})
</script>
```
# 感谢Star

欢迎PR，意见，想法，感谢各位大佬的支持

![](https://komarev.com/ghpvc/?username=royalknight56&color=blue)


## Thanks
