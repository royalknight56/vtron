<template>
  <div class="icon">
    <Suspense>
      <FileIconImg :file="file" :icon="icon" />
    </Suspense>
  </div>
</template>
<script setup lang="ts">
import FileIconImg from './components/FileIconImg.vue';
import { VtronFileWithoutContent } from '@feature/core/FileSystem';
defineProps<{
  file?: VtronFileWithoutContent | null;
  icon?: string;
}>();
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
