<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-06-24 14:32:08
 * @Description: 
 * @FilePath: /myindex/src/App.vue
-->
<template>
  <div class="outer">
    <WinVue></WinVue>
  </div>
</template>

<script setup lang="ts">
import { initConfig, plug_option } from "./packages/appconfig";
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
  
  AddToDesktop({
    name: '浏览器1',
    window: new DragWindow({
      isScalable: false,
      content: Test3
    })
  });
  AddToDesktop({
    name: '我的电脑',
    icon: brow,
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
    name: 'Vue浏览器',
    window: new DragWindow({
      isVue:true,
      content: 'http://localhost:3002/app'
    })
  });
  AddToDesktop({
    name: '浏览器',
    window: new DragWindow({
      content: 'https://v3.cn.vuejs.org/api/global-api.html#h'
    })
  });
  AddToDesktop({
    name: '浏览器',
    icon: brow,
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
  // start_menu_logo: brow,
}
initConfig(opt)

</script>
<style scoped>
.outer {
  position: relative;
  top: 0px;
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
