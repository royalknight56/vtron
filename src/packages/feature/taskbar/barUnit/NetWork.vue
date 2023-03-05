<template>
    <span v-if="sysInfo.connection > 0" class="segoicon SEGOEUIMDL">&#xE839;</span>
    <span v-else class="segoicon SEGOEUIMDL">&#xEB55;</span>
</template>
<script setup lang="ts">
import { defineProps } from 'vue';
import { useRootState } from '@/packages/feature/state/Root';
let sysInfo = useRootState().system.info;

</script>
<style scoped></style>