<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 15:12:43
 * @Description: 
-->
<template>
  <div class="outer" v-dragable>
    <button @click="test()">Test</button>
    <div class="screen">TEST</div>
    <div class="testright"></div>
  </div>
</template>
<script lang="ts" setup>
import { Notify, vDragable } from '@packages/plug';

async function test() {
  new Notify({
    title: 'title',
    content: '111',
    timeout: 555000,
  });
}
</script>
<style></style>
<style scoped>
.screen {
  position: fixed;
  bottom: 0;
  right: 0i;
}

.testright {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100px;
  height: 100px;
  background-color: red;
}
</style>
