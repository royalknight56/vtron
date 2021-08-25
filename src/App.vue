<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-25 10:15:57
 * @Description: 
 * @FilePath: /myindex/src/App.vue
-->
<template>
  <div class="outer">
    <WinVue></WinVue>
  </div>
</template>

<script setup lang="ts">
import { appList } from "./components/appconfig";
import WinVue from "./components/win.vue";

import brow from "./assets/浏览器.png"
import Test3 from "./components/apps/Test3.vue"
// import computer from "./assets/computer.ico"

appList.push({
  name: '浏览器',
  apptemp: 'Test3',
  icon: brow,
  width: 600,
  height: 500,
  tmp: Test3
});

</script>
<style scoped>
.outer{
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
body{
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
