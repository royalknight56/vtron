<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-09 14:37:52
 * @Description: 
 * @FilePath: /myindex/src/App.vue
-->
<template>
  <div class="outer">
    <winVue></winVue>
  </div>
</template>

<script lang="ts" setup>
import winVue from "./components/win.vue";

</script>
<style scoped>
.outer{
  position: relative;
  width: 90vw;
  height: 90vh;
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
/* body{
  padding: 0;
  margin: 0;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  background-color: rgb(0, 119, 210);
} */
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
