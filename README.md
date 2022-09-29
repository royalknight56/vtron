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

首先，我们需要创建一个system对象，这个对象管理着系统的所有状态信息。

一般来说，我们创建另一个文件，存放system对象
```ts
// system.ts
import { System } from "vue3-win10";
let system = new System({});
export {
  system
}
```

```vue
// App.vue
<Win10 :system="system"></Win10>
<script setup>
import { system } from './system'
</script>
```

此步骤之后，run dev已经可以看到win10启动了

4. 控制屏幕🖥大小

在组件外围包裹一个outer

```html
  <div class="outer">
    <Win10 :system="system"></Win10>
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


## Thanks

@0xgosible 贡献
@vanloswang @ObcbO意见
