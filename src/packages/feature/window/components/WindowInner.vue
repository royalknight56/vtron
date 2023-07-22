<template>
  <iframe
    v-if="typeof window.content === 'string'"
    :src="window.content"
    frameborder="0"
    width="100%"
    height="100%"
  ></iframe>
  <Suspense v-else>
    <component :is="window.content"></component>
  </Suspense>
</template>
<script setup lang="ts">
import { UnwrapNestedRefs } from 'vue';
import { BrowserWindow } from '../BrowserWindow';
defineProps<{
  window: UnwrapNestedRefs<BrowserWindow>;
}>();
</script>
