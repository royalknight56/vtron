<template>
  <WindowNode v-for="node in winArray" :key="node?.id" :window="node" />
</template>
<script lang="ts" setup>
import WindowNode from './WindowNode.vue';
import { useSystem } from '@feature/system';
const rootState = useSystem()._rootState;
const winArray = rootState.system.windowOrder;
</script>
<style lang="scss" scoped>
.window-node {
  position: relative;
  z-index: 3;
}
</style>
