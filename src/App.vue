<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-03-18 16:46:19
 * @Description: 
 * @FilePath: /myindex/src/App.vue
-->
<template>
  <div class="outer">
    <WinVue></WinVue>
  </div>
</template>

<script setup lang="ts">
import { appList, appconfig,initConfig, plug_option } from "./packages/appconfig";
import WinVue from "./packages/Win.vue";

import brow from "./assets/浏览器.png"
import backimg from "./assets/back.jpg"
import Test3 from "./apps/Test3.vue"
import Browser from "./apps/Browser.vue"
import TestButton from "./apps/TestButton.vue"
import app_vscode from "./apps/app_vscode.vue"

import { AddToDesktop, ClearDesktop } from "./plug";

import Mycom from "./apps/MyComputer.vue"
import { DragWindow } from "./packages/window/libs/DragWindow";
import { onMounted } from "@vue/runtime-core";

// import computer from "./assets/computer.ico"
onMounted(() => {
  ClearDesktop();
  // let testwin = new DragWindow(
  //   {
  //     title: '浏览器',
  //     icon: brow,
  //     width: 600,
  //     height: 500,
  //     x: 100,
  //     y: 100,
  //     content: Mycom,
  //     isScalable: false
  //   })

  AddToDesktop({
    name: '浏览器',
    // icon: brow,
    // 0, 0, '窗口通信', brow, 600, 500, 
    window: new DragWindow({
      // title: '浏览器',
      // icon: brow,
      // width: 600,
      // height: 500,
      // x: 100,
      // y: 100,
      // isScalable: false,
      content: Test3
    })
  });
  AddToDesktop({
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

  AddToDesktop({
    name: '浏览器',
    icon: brow,
    // 0, 0, '窗口通信', brow, 600, 500,
    window: new DragWindow(
      {
        title: '浏览器',
        icon: brow,
        width: 600,
        height: 500,
        content: Browser
      })
  });
  let testVue = new DragWindow(
    {
      title: '测试按钮',
      icon: brow,
      width: 200,
      height: 200,
      content: TestButton
    })
  AddToDesktop({
    name: '测试按钮',
    icon: brow,
    window: testVue
  });



  AddToDesktop({
    name: 'vscode',
    icon: brow,
    // 0, 0, '窗口通信', brow, 600, 500,
    window: new DragWindow(
      {
        title: 'vscode',
        icon: brow,
        width: 600,
        height: 500,
        content: app_vscode
      })
  });
})

let opt: plug_option = {
  if_logo_show: true,
  start_time: 0,
  backimg: backimg,
  // login: {
  //   user_name: 'AdDD',
  //   user_password:'123'
  // },
  start_menu_logo: brow,
}
initConfig(opt)

</script>
<style scoped>
.outer {
  position: relative;
  top: 20px;
  width: 100vw;
  height: 100vh;
}
</style>
<style>
img,
svg {
  display: block;
  vertical-align: middle;
}
body {
  padding: 0;
  margin: 0;
  /* overflow: hidden; */
}
</style>
