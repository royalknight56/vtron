<template>
    <div class="appicon-group">
        <template v-for="node in treeRoot.children" :key="node.value?.id">
            <AppIcon v-if="node.value.windowInfo.isCreated" :windowNode="node.value" />
        </template>
    </div>
</template>
<script lang="ts" setup>
import AppIcon from './AppIcon.vue';
import { useRootState } from '@packages/feature/state/Root';
let rootState = useRootState();
let treeRoot = rootState.system.windowTree;
</script>
<style lang="scss" scoped>
.appicon-group{
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    flex-grow: 1;
    overflow-x: auto;
    overflow: hidden;
    scrollbar-width: none;
    &::-webkit-scrollbar {
        display: none;
    }
}
</style>