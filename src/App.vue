<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-09-30 14:35:45
 * @Description: 
 * @FilePath: /myindex/src/App.vue
-->
<template>
  <div class="outer">
    <WinVue></WinVue>
  </div>
</template>

<script setup lang="ts">
import { appList, appconfig, plug_option } from "./components/appconfig";
import WinVue from "./components/win.vue";

import brow from "./assets/浏览器.png"
import Test3 from "./components/apps/Test3.vue"
import Mycom from "./components/apps/MyComputer.vue"
import { DragWindow } from "./components/window/libs/DragWindow";
import { onMounted } from "@vue/runtime-core";
// import computer from "./assets/computer.ico"
onMounted(() => {
  appList.push({
    name: '浏览器',
    icon: brow,
    window: new DragWindow(0, 0, '窗口通信', brow, 600, 500, { content: Test3 })
  });
  appList.push({
    name: '我的电脑',
    icon: brow,
    window: new DragWindow(0, 0, '窗口通信', brow, 600, 500, { content: Mycom })
  });
})

// new DragWindow(0, 0, '窗口通信',beatico, 300, 400, { content: AdmVue},[ElementPlus])

let opt: plug_option = {
  if_logo_show: false,
  start_time: 0
}
Object.assign(appconfig, opt)


</script>
<style scoped>
.outer {
  position: relative;
  width: 100vw;
  height: 100vh;
}
</style>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center; */
  /* color: #2c3e50; */
  /* margin-top: 60px; */
}
body {
  padding: 0;
  margin: 0;
  overflow: hidden;
}
/* .dragobj {
  cursor: all-scroll;
  position: absolute;
  user-select: none;
  width: 100px;
  height: 100px;
  background-color: #2c3e50;
}
.cube3 {
  z-index: -1;
  background-color: antiquewhite;
  position: absolute;
  user-select: none;
  width: 100px;
  height: 100px;
} */
</style>
