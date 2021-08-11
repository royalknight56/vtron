<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-10 20:02:46
 * @Description: 
 * @FilePath: /myindex/template/src/App.vue
-->
<template>
  <div class="outer">
    <WinVue></WinVue>
  </div>
</template>

<script lang="ts" setup>
import WinVue from "./components/win.vue";

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
}

</style>
