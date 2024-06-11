<script setup lang="ts">
import { System } from 'vtron';
import { vtronPlus } from './packages/plug';
import { Screen } from 'vtron';

const system = new System({
  rootStyle: {},
});
system.whenReady().then(() => {
  system.use(vtronPlus);
});
</script>

<template>
  <div class="outer">
    <Screen :system="system"></Screen>
  </div>
</template>

<style scoped>
.outer {
  width: 100vw;
  height: 100vh;
  background-color: #000;
}
</style>
