<template>
  <Transition name="window-animate">
    <WindowTemplate v-if="window.windowInfo.isCreated" :browser-window="window"></WindowTemplate>
  </Transition>
  <WindowNode v-for="node in window.children" :key="node.id" :window="node" />
</template>
<script lang="ts" setup>
import { BrowserWindow } from '@feature/window/BrowserWindow';
import { UnwrapNestedRefs } from 'vue';
import WindowNode from './WindowNode.vue';
import WindowTemplate from './WindowTemplate.vue';

defineProps<{
  window: UnwrapNestedRefs<BrowserWindow>;
}>();
</script>
<style lang="scss" scoped>
.window-animate-enter-active,
.window-animate-leave-active {
  transition: all 0.1s ease;
}

.window-animate-enter-from,
.window-animate-leave-to {
  opacity: 0;
}
</style>
