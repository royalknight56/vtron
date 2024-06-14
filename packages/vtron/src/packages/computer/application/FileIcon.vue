<template>
  <div class="icon">
    <Suspense>
      <FileIconImg :file="file" :icon="icon" />
    </Suspense>
    <div v-if="extname(file?.path || '') === '.ln'" class="ln-img">
      <img :src="lnicon" alt="ln" />
    </div>
  </div>
</template>
<script setup lang="ts">
import lnicon from '@packages/assets/ln.png';
import FileIconImg from './components/FileIconImg.vue';
import { VtronFileWithoutContent, extname } from '@packages/kernel';

defineProps<{
  file?: VtronFileWithoutContent | null;
  icon?: string;
}>();
</script>
<style lang="scss" scoped>
.icon {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .ln-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
