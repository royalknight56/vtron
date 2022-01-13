<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-01-13 15:50:57
 * @Description: 
 * @FilePath: /myindex/src/App.vue
-->
<template>
  <div class="outer">
    <WinVue></WinVue>
  </div>
</template>

<script setup lang="ts">
import { appList, appconfig, plug_option } from "./packages/appconfig";
import WinVue from "./packages/Win.vue";

import brow from "./assets/浏览器.png"
import backimg from "./assets/back.jpg"
import Test3 from "./apps/Test3.vue"
import Mycom from "./apps/MyComputer.vue"
import { DragWindow } from "./packages/window/libs/DragWindow";
import { onMounted } from "@vue/runtime-core";
// import computer from "./assets/computer.ico"
onMounted(() => {
  let testwin = new DragWindow(
    {
      title: '浏览器',
      icon: brow,
      width: 600,
      height: 500,
      content: Mycom,
      isScalable: false
    })
  appList.splice(0, 100000)
  appList.push({
    name: '浏览器',
    icon: brow,
    // 0, 0, '窗口通信', brow, 600, 500, 
    window: new DragWindow({
      title: '浏览器',
      icon: brow,
      width: 600,
      height: 500,
      x: 0,
      y: 0,
      content: Test3
    })
  });
  appList.push({
    name: '我的电脑',
    icon: brow,
    // 0, 0, '窗口通信', brow, 600, 500,
    window: new DragWindow(
      {
        title: '浏览器',
        icon: brow,
        width: 600,
        height: 500,
        content: Mycom
      })
  });
  appList.push({ name: '我的电脑', icon: brow, window: testwin });
  appList.push({ name: '我的电脑', icon: brow, window: testwin });
  appList.push({ name: '我的电脑', icon: brow, window: testwin });
  appList.push({ name: '我的电脑', icon: brow, window: testwin });
  appList.push({ name: '我的电脑', icon: brow, window: testwin });
  appList.push({ name: '我的电脑', icon: brow, window: testwin });
  appList.push({ name: '我的电脑', icon: brow, window: testwin });
  appList.push({ name: '我的电脑', icon: brow, window: testwin });
  appList.push({ name: '我的电脑', icon: brow, window: testwin });
  appList.push({ name: '我的电脑', icon: brow, window: testwin });
  appList.push({ name: '我的电脑', icon: brow, window: testwin });
})

let opt: plug_option = {
  if_logo_show: true,
  start_time: 0,
  // backimg: backimg,
  login: {
    user_name: 'Ad',
    user_password: ''
  },
  start_menu_logo: brow,
}
Object.assign(appconfig, opt)


</script>
<style scoped>
.outer {
  position: relative;
  top: 300px;
  width: 500px;
  height: 400px;
}
</style>
<style>
#app {
  /* font-family: Avenir, Helvetica, Arial, sans-serif; */
  /* -webkit-font-smoothing: antialiased; */
  /* -moz-osx-font-smoothing: grayscale; */
  /* text-align: center; */
  /* color: #2c3e50; */
  /* margin-top: 60px; */
}
body {
  padding: 0;
  margin: 0;
  /* overflow: hidden; */
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
