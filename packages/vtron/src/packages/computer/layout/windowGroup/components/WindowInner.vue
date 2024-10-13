<template>
  <iframe
    v-if="typeof window.content === 'string'"
    :src="window.content"
    frameborder="0"
    width="100%"
    height="100%"
    class="viewer"
    :class="{ 'viewer-loading': isLoad }"
    @load="isLoad = false"
  ></iframe>
  <Suspense v-else>
    <component :is="window.content"></component>
  </Suspense>
</template>
<script setup lang="ts">
import { ref, UnwrapNestedRefs } from 'vue';
import { BrowserWindow } from '@/packages/services';
defineProps<{
  window: UnwrapNestedRefs<BrowserWindow>;
}>();
const isLoad = ref(true);
</script>
<style scoped>
.viewer {
  width: 100%;
  height: 100%;
  background-color: #00000000;
}
.viewer-loading {
  animation: loading 1s infinite;
}
@keyframes loading {
  50% {
    background-color: #00000051;
  }
  0%,
  100% {
    background-color: #00000000;
  }
}
</style>
