<template>
    <div class="window-node">
        <div class="window-children">
            <WindowNode v-for="node in rootState.system.windowTree.children" :key="node.value?.id" :windowNode="node" />
        </div>
    </div>
</template>
<script lang="ts" setup>
import { useRootState } from '../state/Root';
import { Tree } from "@packages/util/Tree"
import WindowNode from './WindowNode.vue';

let rootState = useRootState();
rootState.system.windowTree;
</script>
<style lang="scss" scoped>

</style>