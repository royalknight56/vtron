<template>
  <div class="icon">
    <img v-if="icon" draggable="false" :src="icon" />
    <img v-else draggable="false" :src="dealIcon(file, sys)" />
  </div>
</template>
<script setup lang="ts">
import { defineProps } from 'vue';
import { VtronFile } from '@feature/core/fileSystem';
import { useSystem } from '@feature/system';
import { dealIcon } from '@/packages/util/Icon';
defineProps<{
  file?: VtronFile | null;
  icon?: string;
}>();
const sys = useSystem();
</script>
<style lang="scss" scoped>
.icon {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>
@/packages/feature/core/FileSystem
