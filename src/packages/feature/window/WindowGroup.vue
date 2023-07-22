<template>
  <WindowNode v-for="node in winArray" :key="node?.id" :window="node" />
</template>
<script lang="ts" setup>
import { useRootState } from '@feature/state/Root';
import { Tree } from '@packages/util/Tree';
import WindowNode from './WindowNode.vue';

const rootState = useRootState();
const winArray = rootState.system.windowOrder;
</script>
<style lang="scss" scoped>
.window-node {
  position: relative;
  z-index: 3;
}
</style>
