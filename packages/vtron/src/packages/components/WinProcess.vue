<template>
  <div class="win-process" ref="outerRef">
    <div class="handle" @mousedown="handleMouseDown" :style="{ left: process + '%' }"></div>
  </div>
</template>
<script setup lang="ts">
import { defineProps, ref } from 'vue';
const props = defineProps<{
  modelValue?: number;
  changeAble?: boolean;
}>();
const emit = defineEmits(['update:modelValue']);
const process = ref(props.modelValue || 0);
const outerRef = ref<HTMLElement>();

const handleMouseDown = (e: MouseEvent) => {
  if (!props.changeAble) return;
  const startX = e.clientX;
  const startLeft = process.value;
  const handleMouseMove = (e: MouseEvent) => {
    const moveX = e.clientX - startX;
    const moveLeft = startLeft + (moveX / (outerRef.value?.clientWidth || 1)) * 100;
    process.value = Math.max(0, Math.min(100, moveLeft));
    emit('update:modelValue', process.value);
  };
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};
</script>
<style lang="scss" scoped>
.win-process {
  display: flex;
  align-items: center;
  width: 100%;
  height: 5px;
  position: relative;
  background-color: rgb(215, 215, 215);
  .handle {
    transform: translateX(-50%);
    width: 8px;
    height: 20px;
    position: relative;
    left: 0;
    top: 0;
    cursor: pointer;
    border-radius: 5px;
    background-color: rgb(109, 109, 109);
    &:hover {
    }
  }
}
</style>
