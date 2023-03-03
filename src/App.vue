<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:17:09
 * @Description: 
 * @FilePath: /myindex/src/App.vue
-->
<template>
  <div class="outer">
    <Screen></Screen>
  </div>
</template>

<script setup lang="ts">
import brow from "./assets/浏览器.png"
import testicon from "./assets/终端.png"

// import Test3 from "./apps/Test3.vue"
// import Browser from "./apps/Browser.vue"
import TestButton from "./apps/TestButton.vue"
// import app_vscode from "./apps/app_vscode.vue"
// import APIVue from "./apps/API.vue"
import Mycom from "./apps/MyComputer.vue"

import { onMounted, reactive, ref } from "vue";
import { System } from "./packages/plug";
import { BrowserWindow } from "./packages/feature/window/BrowserWindow";

onMounted(() => {
  new System({}).whenReady().then((system) => {
    for (let i = 0; i < 50; i++) {
      system.addApp({
        name: '测试按钮',
        icon: testicon,
        window: new BrowserWindow({
          content:TestButton,
          icon: testicon,
        })
      });
      system.addApp({
        name: 'Mycom',
        icon: brow,
        window: new BrowserWindow({
          content:Mycom,
          icon: brow,
        })
      });
      system.addMagnet({
        name: '测试Magnet',
        icon: testicon,
        window: new BrowserWindow({
          content:TestButton,
          icon: testicon,
        })
      });
      system.addMenuList({
        name: '测试MenuList',
        icon: brow,
        window: new BrowserWindow({
          content:TestButton,
          icon: brow,
        })
      });

    }
  });
  // for (let i = 0; i < 30; i++) {
  //   system.AddToStartupList({
  //     name: '测试按钮',
  //     icon: brow,
  //     window: testVue
  //   });
  // }
  // for (let i = 0; i < 30; i++) {
  //   system.AddToMagnet({
  //     name: '测试按钮',
  //     icon: brow,
  //     window: testVue
  //   });
  // }

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
