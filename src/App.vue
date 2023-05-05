<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:17:09
 * @Description: 
 * @FilePath: /myindex/src/App.vue
-->
<template>
  <div class="outer">
    <Screen></Screen>
    <!-- <button @click="save">save</button>
    <button @click="restore">restore</button> -->

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
import vtronLogoIcon from "./assets/vtron-icon-nobg.png"
let sys:System|null = null;
async function save(){
  let state = await sys?.serializeState();
  localStorage.setItem('vtron-state', JSON.stringify(state));
}
async function restore(){
  let state = localStorage.getItem('vtron-state');
  if(state){
    await sys?.deserializeState(JSON.parse(state));
  }
}
onMounted(() => {
  sys =  new System({
    logo: vtronLogoIcon,
    background: "https://source.unsplash.com/random/1920x1080",
    desktop: [
      {
        name: '测试Url',
        // icon: testicon,
        window: {
          content: "https://source.unsplash.com/random/1920x1080",
          title: "测试按钮",
          icon: testicon,
          center: true,
          // backgroundColor: "rgba(0,0,0,1)",
        },
      },
      {
        name: '测试按钮2',
        // icon: testicon,
        window: {
          content: TestButton,
          title: "测试按钮",
          icon: testicon,
          center: true,
          // backgroundColor: "rgba(0,0,0,1)",
        },
      },
      {
        name: '测试按钮3',
        // icon: testicon,
        window: {
          content: TestButton,
          title: "测试按钮",
          icon: testicon,
          center: true,
          // backgroundColor: "rgba(0,0,0,1)",
        },
      },
      {
        name: '测试按钮4',
        // icon: testicon,
        window: {
          content: TestButton,
          title: "测试按钮",
          icon: testicon,
          center: true,
          // backgroundColor: "rgba(0,0,0,1)",
        },
      },
      {
        name: '测试不可缩放',
        icon: testicon,
        window: {
          content: TestButton,
          title: "测试不可缩放",
          icon: testicon,
          center: true,
          frame: false,
          fullscreen: true,
          resizable: false,
          backgroundColor: "rgba(0,0,0,0)",
        }
      },
      {
        name: 'Vtron自动测试',
        icon: testicon,
        window: {
          content: VtronTest,
          title: "Vtron自动测试",
          icon: testicon,
          center: true,
        }
      }
    ],
    rootStyle:{
      '--color-ui-desk-item-title': '#a30',
      '--window-border-radius': '4px',
      // '--menu-bar-height':'100px'
    }
  })
  sys.whenReady().then((system) => {
    setTimeout(() => {
      system.fs.writeFile('/C/Users/Desktop/看月亮',
        {
          content: "http://static.myim.online/moon/",
          icon: testicon,
          type: 'ink/url'
        }
      )
    }, 3000);
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
