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
import TestButton from "./apps/TestButton.vue"
import VtronTest from "./apps/VtronTest.vue";
import { onMounted, ref } from "vue";
import { System } from "./packages/plug";
import { BrowserWindow } from "./packages/feature/window/BrowserWindow";

onMounted(() => {
  let testw = new BrowserWindow({
    content: TestButton,
    title: "测试按钮",
    icon: testicon,
    center: true,
  })
  new System({
    background: "https://source.unsplash.com/random/1920x1080",
    desktop: [
      {
        name: '测试按钮',
        icon: testicon,
        window: testw
      },
      {
        name: '测试不可缩放',
        icon: testicon,
        window: new BrowserWindow({
          content: TestButton,
          title: "测试不可缩放",
          icon: testicon,
          center: true,
          resizable: false,
        })
      },
      {
        name: 'Vtron自动测试',
        icon: testicon,
        window: new BrowserWindow({
          content: VtronTest,
          title: "Vtron自动测试",
          icon: testicon,
          center: true,
        })
      }
    ]
  }).whenReady().then((system) => {
    setTimeout(() => {
      system.addApp({
        name: '看月亮',
        icon: testicon,
        window: new BrowserWindow({
          content: "http://static.myim.online/moon/",
          title: "看月亮",
          icon: testicon,
          center: true,
        })
      })
    }, 3000);
    // autoTestApp.show()

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
