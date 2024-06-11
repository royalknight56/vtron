<template>
  <WindowNode v-for="node in winArray" :key="node?.id" :window="node" />
</template>
<script lang="ts" setup>
import { System } from '@/packages/kernel';
import { inject } from 'vue';
import WindowNode from './WindowNode.vue';
const sys = inject<System>('system')!;
const windowTree = sys.stateManager.windowTree;
const winArray = windowTree.windowOrder;
</script>
<style lang="scss" scoped>
.window-node {
  position: relative;
  z-index: 3;
}
</style>
