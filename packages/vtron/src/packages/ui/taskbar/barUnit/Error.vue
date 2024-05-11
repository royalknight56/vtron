<template>
  <div
    class="error"
    :class="{
      ani: currentError,
    }"
    :key="currentError"
  >
    {{ currentError }}
  </div>
</template>
<script setup lang="ts">
import { useSystem } from '@packages/kernel';

const system = useSystem();

const currentError = system.stateManager.error.current;
</script>
<style lang="scss" scoped>
.error {
  width: min-content;
  height: 100%;
  background-color: rgba(255, 0, 0, 0);
  color: rgb(60, 60, 60);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}
.ani {
  animation: error 0.4s ease-in-out;
}
@keyframes error {
  0% {
    background-color: rgba(255, 0, 0, 0);
  }
  20% {
    background-color: rgba(255, 0, 0, 0.17);
  }
  100% {
    background-color: rgba(255, 0, 0, 0);
  }
}
</style>
@/packages/kernel/system
