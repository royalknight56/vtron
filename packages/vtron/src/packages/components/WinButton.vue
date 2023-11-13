<template>
  <button
    class="win-button"
    :class="{
      'win-button--loading': loading,
    }"
    :disabled="loading"
  >
    <slot></slot>
  </button>
</template>
<script lang="ts" setup>
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});
</script>
<style scoped lang="scss">
.win-button {
  background-color: var(--color-ui-gray);
  border: var(--light-border);
  cursor: pointer;
  transition: all 0.1s;
  font-size: var(--ui-font-size);
  width: var(--ui-button-width);
  height: var(--ui-button-height);
  border-width: 1px;
  box-sizing: border-box;
  white-space: nowrap;
  &:hover {
    border-width: 2px;
    border-color: var(--color-blue);
    background-color: var(--color-light-blue);
  }
}
.win-button--loading {
  animation: loading 1s infinite;
}
.win-button--loading:hover {
  border-width: 1px;
  border-color: rgba(118, 118, 171, 0.355);
  background-color: var(--color-light-blue);
}
@keyframes loading {
  0% {
    background-color: var(--color-ui-gray);
  }
  50% {
    background-color: var(--color-light-blue);
  }
  100% {
    background-color: var(--color-ui-gray);
  }
}
</style>
