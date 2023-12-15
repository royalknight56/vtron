<template>
  <span v-if="sysInfo.connection.rtt > 0" class="segoicon SEGOEUIMDL">&#xE839;</span>
  <span v-else class="segoicon SEGOEUIMDL">&#xEB55;</span>
</template>
<script setup lang="ts">
import { useSystem } from '@feature/system';
const rootState = useSystem()._rootState;
const sysInfo = rootState.info;
</script>
<style scoped></style>
