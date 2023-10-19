<template>
  <button class="win-button">
    <slot></slot>
  </button>
</template>
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
  &:hover {
    border-width: 2px;
    border-color: var(--color-blue);
    background-color: var(--color-light-blue);
  }
}
</style>
