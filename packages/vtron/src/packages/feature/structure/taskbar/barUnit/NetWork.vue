<template>
  <span v-if="sysInfo.connection.rtt > 0" class="segoicon SEGOEUIMDL">&#xE839;</span>
  <span v-else class="segoicon SEGOEUIMDL">&#xEB55;</span>
</template>
<script setup lang="ts">
import { useRootState } from '@feature/state/Root';
const sysInfo = useRootState().system.info;
</script>
<style scoped></style>
