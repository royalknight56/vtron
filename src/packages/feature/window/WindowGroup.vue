<template>
    <WindowNode v-for="node in rootState.system.windowTree.children" :key="node.value?.id" :windowNode="node" />
</template>
<script lang="ts" setup>
import { useRootState } from '@packages/feature/state/Root';
import { Tree } from "@packages/util/Tree"
import WindowNode from './WindowNode.vue';

let rootState = useRootState();
rootState.system.windowTree;
</script>
<style lang="scss" scoped>
.window-node{
    position: relative;
    z-index: 3;
}
</style>