<template>
  <div
    class="rect"
    draggable="false"
    :style="{
      left: rect.left + 'px',
      top: rect.top + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
    }"
  ></div>
</template>
<script lang="ts" setup>
defineProps<{
  rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}>();
</script>
<style lang="scss" scoped>
.rect {
  position: absolute;
  border: 1px solid #0076d7;
  background-color: rgba(0, 118, 215, 0.2);
  z-index: 999;
}
</style>
