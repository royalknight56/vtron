<template>
  <Transition name="windowanimate" appear>
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
.windowanimate-enter-active,
.windowanimate-leave-active {
  transition: all 0.2s var(--aniline);
}

.windowanimate-enter-to,
.windowanimate-leave-from {
  opacity: 1;
  // filter: blur(0px);
  transform: scale(1);
}

.windowanimate-enter-from,
.windowanimate-leave-to {
  opacity: 0;
  // filter: blur(10px);
  transform: scale(0.9);
}
</style>
