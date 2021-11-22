<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-11-22 17:33:00
 * @Description: 翻译下面的文档
-->
<h1 align="center">vue3-win10</h1>


<div align="center">

Vue3 imitation win10 UI framework
</div>

<a href="https://github.com/royalknight56/vue3-windows10/blob/master/README_en.md" target="_blank">English</a>|<a href="https://github.com/royalknight56/vue3-windows10" target="_blank">中文</a>

<a href="http://v3w10.myim.online" target="_blank">Document</a>|<a href="http://v3w10.myim.online" target="_blank">Official</a>|<a href="http://myim.online" target="_blank">Demo</a>

<span style="color:#999;text-align:center">recommend Vue 3 + Typescript + Vite + Using `<script setup>`
</span>


This framework can turn your page into a win10 system on a web page like the win10 window system.
<!-- : [myim.online](http://myim.online) -->
![IMAGE](./rdmassert/open.gif)
![IMAGE](./rdmassert/wintmp.gif)

# Usage

## Development steps


1. Install vue3-win10

> npm install vue3-win10

2. Use plug in in Vue

```js
import win10 from 'vue3-win10';
```
import css file "vue3-win10/distlib/style.css"

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


3. Import Win10 component in vue file
 
```html
<Win10></Win10>
```

After this step,we can see that win10 starts


4. Control screen size

Wrap an outer around the component

```html
  <div class="outer">
    <Win10></Win10>
  </div>
```
Define .outer style
  
```html
<style scoped>
.outer {
  width: 100vw;
  height: 100vh;
}
</style>
```
This is the full page display


4. Create a new Vue file in the ./apps folder. It is mainly used to write window content in this folder (not required)
