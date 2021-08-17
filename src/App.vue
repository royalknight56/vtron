<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-11 11:24:10
 * @Description: 
 * @FilePath: /myindex/src/App.vue
-->
<template>
  <div class="outer">
    <WinVue></WinVue>
  </div>
</template>

<script setup lang="ts">
import WinVue from "./components/win.vue";

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
