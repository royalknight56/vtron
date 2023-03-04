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

import { onMounted, ref } from "vue";
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
          center: true,
        })
      });
      system.addApp({
        name: '测试链接',
        icon: brow,
        window: new BrowserWindow({
          content:"http://localhost:5173/",
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
