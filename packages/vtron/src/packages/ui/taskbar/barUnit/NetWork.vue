<template>
  <span v-if="navigator.connection.rtt > 0" class="segoicon SEGOEUIMDL">&#xE839;</span>
  <span v-else class="segoicon SEGOEUIMDL">&#xEB55;</span>
</template>
<script setup lang="ts">
import { System } from '@packages/kernel';
import { inject } from 'vue';
const sys = inject<System>('system')!;
const navigator = sys.stateManager.navigator;
</script>
<style scoped></style>
