<!--
 * @Author: Royal
 * @LastEditTime: 2022-04-26 15:08:12
 * @Description: 
 * @FilePath: /myindex/README.md
-->

<p align="center"><a href="https://myim.online" target="_blank" rel="noopener noreferrer"><img width="200" src="./rdmassert/vtron-logo-nobg.png" alt="vtron logo"></a></p>

<div align="center">

vtron, a Win10 UI framework based on Vue3

</div>

<div align="center">

<a href="http://v3w10.myim.online" target="_blank">Document</a>|<a href="http://v3w10.myim.online" target="_blank">Official website
</a>|<a href="http://myim.online" target="_blank">Demo</a>

</div>

<span style="color:#999;text-align:center">recommend Vue 3 + Typescript + Vite + Using `<script setup>`

</span>

English | [中文](./README.md) 

 This framework allows your page to run a win10 system on a web page like the Win10 window system.



## Development Process



1. Install vtron

> npm install vtron

2. Use the plugin in Vue

```js
import vtron from 'vtron';
```
Import the style file "vtron/distlib/style.css"


```js
import "vtron/distlib/style.css"
```

usage

```js
import { createApp } from 'vue'
import App from './App.vue'
import vtron from 'vtron';
import "vtron/distlib/style.css"

createApp(App).use(vtron).mount('#app')
```


3. Include the Screen component in the page


First, we need to create a system object, which manages all the system's state information.


```vue
// App.vue
<Screen></Screen>
<script setup>
import { System } from "vtron";
let system = new System();
</script>
```

After this step, you can see Win10 starting when you run dev.


4. Control screen size

Wrap the component in an outer div

```vue
  <div class="outer">
    <Screen></Screen>
  </div>
```
Define outer style


```html
<style scoped>
.outer {
  width: 100vw;
  height: 100vh;
}
</style>
```
This will make it occupy the entire page display.


4. Create a new Vue file in the apps folder, mainly write window content in this folder (not required)


```vue
<template>
  <div class="app">
    <h1>HelloWorld</h1>
  </div>
</template>
```
5. Register the app in the system


Pass configuration options to the system's constructor,

The desktop is the configuration item for the desktop, which can be configured with multiple apps.

```vue
<Screen></Screen>
<script setup>
import { System, BrowserWindow} from "vtron";
import { App } from "./apps/App.vue";
import someicon from "./assets/someicon.png";
import HelloWorld from "./apps/HelloWorld.vue";
let system = new System({
  desktop:[
    {
      name: 'HelloWorld',
      icon: someicon,
      window: new BrowserWindow({
        content:HelloWorld,
        icon: someicon,
      })
    }
  ]
});

</script>
```
# Thanks for the Star

Thanks for your star, welcome to PR, opinion, idea, thanks for your support

![](https://komarev.com/ghpvc/?username=royalknight56&color=blue)


## Thanks