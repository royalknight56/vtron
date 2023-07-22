<template>
  <div class="appicon-group">
    <template v-for="node in treeRoot">
      <AppIcon
        :key="node.id"
        v-if="node.windowInfo.isCreated && !node.windowInfo.skipTaskbar"
        :window-node="node"
      />
    </template>
  </div>
</template>
<script lang="ts" setup>
import AppIcon from './AppIcon.vue';
import { useRootState } from '@feature/state/Root';
const rootState = useRootState();
const treeRoot = rootState.system.windowOrder;
</script>
<style lang="scss" scoped>
.appicon-group {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  flex-grow: 1;
  overflow-x: auto;
  overflow: hidden;
  scrollbar-width: none;
  z-index: 41;
  background-color: inherit;

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
