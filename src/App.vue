<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:17:09
 * @Description: 
 * @FilePath: /myindex/src/App.vue
-->
<template>
  <div class="outer">
    <Win10 :system="p1"></Win10>
  </div>
  <!-- <div class="outer">
    <Win10 :system="p2"></Win10>
  </div> -->
</template>

<script setup lang="ts">
import brow from "./assets/浏览器.png"
import Test3 from "./apps/Test3.vue"
import Browser from "./apps/Browser.vue"
import TestButton from "./apps/TestButton.vue"
import app_vscode from "./apps/app_vscode.vue"

// import { AddToDesktop, ClearDesktop } from "./plug";

import Mycom from "./apps/MyComputer.vue"
// import { DragWindow } from "./packages/window/libs/DragWindow";
import { onMounted, reactive, ref } from "vue";
import { system, system2 } from "./systeminit"
// import computer from "./assets/computer.ico"
let p1 = system;
let p2 = system2;

let testVue = system.DragWindow(
  {
    title: '测试按钮',
    icon: brow,
    width: 200,
    height: 200,
    frame: true,
    // transparent: true,
    // center: true,
    // buttons:[],
    content: TestButton
  })
testVue.show().setPosition(100, 100)
onMounted(() => {

  // setTimeout(() => {
  //   testVue.setPosition(100, 200).setFullScreen(true)
  // }, 1000)
  // setTimeout(() => {
  //   testVue.setFullScreen(false)
  // }, 2000)
  system.ClearDesktop();
  system2.ClearDesktop();
  system2.AddToDesktop({
    name: '浏览器',
    window: system2.DragWindow({
      content: 'https://v3.cn.vuejs.org/api/global-api.html#h'
    })
  });
  system.AddToDesktop({
    name: 'Local',
    window: system.DragWindow({
      content: 'http://localhost:3000/'
    })
  });

  system.AddToDesktop({
    name: 'Baidu',
    window: system.DragWindow({
      content: 'https://www.google.com.hk/'
    })
  });

  system.AddToDesktop({
    name: '浏览器1',
    window: system.DragWindow({
      isScalable: false,
      content: Test3
    })
  });
  system.AddToDesktop({
    name: '我的电脑',
    icon: brow,
    window: system.DragWindow(
      {
        title: '浏览器',
        icon: brow,
        width: 600,
        height: 500,
        content: Mycom
      })
  });
  system.AddToDesktop({
    name: 'Vue浏览器',
    window: system.DragWindow({
      content: 'http://localhost:3002/app'
    })
  });
  system.AddToDesktop({
    name: '浏览器',
    window: system.DragWindow({
      content: 'https://v3.cn.vuejs.org/api/global-api.html#h'
    })
  });
  system.AddToDesktop({
    name: '浏览器',
    icon: brow,
    window: system.DragWindow(
      {
        title: '浏览器',
        icon: brow,
        width: 600,
        height: 500,
        content: Browser
      })
  });
  system.AddToDesktop({
    name: '浏览器',
    icon: brow,
    window: system.DragWindow(
      {
        title: '浏览器',
        icon: brow,
        width: 600,
        height: 500,
        content: Browser
      })
  });

  system.AddToDesktop({
    name: '测试按钮',
    icon: brow,
    window: testVue
  });
  system.AddToDesktop({
    name: 'vscode',
    icon: brow,
    window: system.DragWindow(
      {
        title: 'vscode',
        icon: brow,
        width: 600,
        height: 500,
        content: app_vscode
      })
  });

  for (let i = 0; i < 3; i++) {
    system.AddToStartupList({
      name: '测试按钮',
      icon: brow,
      window: testVue
    });
  }
  for (let i = 0; i < 30; i++) {
    system.AddToMagnet({
      name: '测试按钮',
      icon: brow,
      window: testVue
    });
  }

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
