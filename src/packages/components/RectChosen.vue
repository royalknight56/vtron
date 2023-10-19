<template>
  <div
    class="rect"
    draggable="false"
    ref="parentRef"
    :style="{
      left: rect.left - (parentRect?.x || 0) + 'px',
      top: rect.top - (parentRect?.y || 0) + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
    }"
  ></div>
</template>
<script lang="ts" setup>
import { onMounted, ref } from 'vue';

defineProps<{
  rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}>();
const parentRef = ref<HTMLElement>();
const parentRect = ref<DOMRect | null>(null);
onMounted(() => {
  const parent = parentRef.value?.parentElement;
  if (parent) {
    parentRect.value = parent.getBoundingClientRect();
  }
});
</script>
<style lang="scss" scoped>
.rect {
  position: absolute;
  border: 1px solid #0076d7;
  background-color: rgba(0, 118, 215, 0.2);
  z-index: 9;
}
</style>
