<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-12 14:35:12
 * @Description: 
 * @FilePath: /myindex/src/App.vue
-->
<template>
  <div class="outer">
    <Win10></Win10>
  </div>
</template>

<script setup lang="ts">

import brow from "./assets/浏览器.png"
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
      isSFC: true,
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
