<template>
  <span v-if="navigator.connection.rtt > 0" class="segoicon SEGOEUIMDL">&#xE839;</span>
  <span v-else class="segoicon SEGOEUIMDL">&#xEB55;</span>
</template>
<script setup lang="ts">
import { useSystem } from '@packages/kernel';
const navigator = useSystem().stateManager.navigator;
</script>
<style scoped></style>
