<script setup lang="ts">
import { System } from 'vtron';
import { vtronPlus } from './packages/plug';
import { VtronComputer } from 'vtron';

const system = new System({
  rootStyle: {},
});
system.whenReady().then(() => {
  system.use(vtronPlus);
  console.log(system);
});
</script>

<template>
  <div class="outer">
    <VtronComputer :system="system"></VtronComputer>
  </div>
</template>

<style scoped>
.outer {
  width: 100vw;
  height: 100vh;
  background-color: #000;
}
</style>
