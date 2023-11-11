<script setup lang="ts">
// import HelloWorld from './components/HelloWorld.vue'
import { System } from 'vtron';
import { vtronPlus } from './packages/plug';
const system = new System({
  rootStyle: {},
});
system.whenReady().then(() => {
  system.use(vtronPlus);
});
</script>

<template>
  <div class="outer">
    <Screen></Screen>
  </div>
</template>

<style scoped>
.outer {
  width: 100vw;
  height: 100vh;
  background-color: #000;
}
</style>
