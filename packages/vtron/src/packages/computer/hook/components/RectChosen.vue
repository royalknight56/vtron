<template>
  <div
    class="rect"
    draggable="false"
    ref="parentRef"
    :style="{
      left: rect.left - parentOrigin.left + 'px',
      top: rect.top - parentOrigin.top + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
    }"
  ></div>
</template>
<script lang="ts" setup>
import { onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue';

const props = defineProps<{
  rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}>();
const parentRef = ref<HTMLElement>();
const parentOrigin = reactive({ left: 0, top: 0 });
function updateParentOrigin() {
  const parent = parentRef.value?.offsetParent;
  if (parent instanceof HTMLElement) {
    const bounds = parent.getBoundingClientRect();
    parentOrigin.left = bounds.left + parent.clientLeft - parent.scrollLeft;
    parentOrigin.top = bounds.top + parent.clientTop - parent.scrollTop;
  }
}
watch(() => [props.rect.left, props.rect.top, props.rect.width, props.rect.height], updateParentOrigin);
onMounted(() => {
  updateParentOrigin();
  window.addEventListener('scroll', updateParentOrigin, true);
  window.addEventListener('resize', updateParentOrigin);
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateParentOrigin, true);
  window.removeEventListener('resize', updateParentOrigin);
});
</script>
<style lang="scss" scoped>
.rect {
  box-sizing: border-box;
  pointer-events: none;
  position: absolute;
  border: 1px solid #0076d7;
  background-color: rgba(0, 118, 215, 0.2);
  z-index: 9;
}
</style>
