<template>
    <WindowNode v-for="node in winArray" :key="node?.id" :window="node" />
</template>
<script lang="ts" setup>
import { useRootState } from '@packages/feature/state/Root';
import { Tree } from "@packages/util/Tree"
import WindowNode from './WindowNode.vue';

let rootState = useRootState();
let winArray =  rootState.system.windowOrder;
</script>
<style lang="scss" scoped>
.window-node{
    position: relative;
    z-index: 3;
}
</style>