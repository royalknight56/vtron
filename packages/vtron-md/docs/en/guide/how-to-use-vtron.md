# How to use Vtron

<p align="center"><a href="https://myim.online" target="_blank" rel="noopener noreferrer"><img width="200" src="./vtron-logo-nobg.png" alt="vtron logo"></a></p>

<div align="center">

vtron, a Win10 UI framework based on Vue3

</div>

<div align="center">

<a href="http://v3w10.myim.online" target="_blank">Doc</a>|<a href="http://v3w10.myim.online" target="_blank">Offical Website</a>|<a href="http://myim.online" target="_blank">Demo</a>

</div>

<span style="color:#999;text-align:center"> Recommended: Vue 3 + Typescript + Vite + Using `<script setup>`
</span>

This framework can make your page like a win10 window system, run a win10 system on a web page.

## Development step

1. install vtron

> npm install vtron

2. use vtron in vue

```js
import vtron from "vtron";
```

import style file "vtron/distlib/style.css"

```js
import "vtron/distlib/style.css";
```

usage

```js
import { createApp } from "vue";
import App from "./App.vue";
import vtron from "vtron";
import "vtron/distlib/style.css";

createApp(App).use(vtron).mount("#app");
```

3. import Screen component

First, we need to create a system object, which manages all the status information of the system.

```vue
// App.vue
<Screen></Screen>
<script setup>
import { System } from "vtron";
let system = new System();
</script>
```

After this step, run dev can see win10 start up

4. control screen size

wrap outer around the component

```vue
<div class="outer">
  <Screen></Screen>
</div>
```

define outer style

```html
<style scoped>
  .outer {
    width: 100vw;
    height: 100vh;
  }
</style>
```

This way, it occupies the entire page display

4. In the apps folder, create a new vue file. The main content of the window is written in this folder (not required)

```vue
<template>
  <div class="app">
    <h1>HelloWorld</h1>
  </div>
</template>
```

5. register app in system

In the constructor of the system, pass in the configuration item,

desktop is the configuration item of the desktop, which can configure multiple apps

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

# Thanks

thanks for your star, welcome to PR, opinion, idea, thanks for your support

![](https://komarev.com/ghpvc/?username=royalknight56&color=blue)
