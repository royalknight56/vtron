<template>
  <div
    class="win-input"
    :style="{
      width: width,
    }"
  >
    <input :type="type" :placeholder="placeholder" :value="modelValue" @input="handleChange" />
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: 'Type here',
  },
  width: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['update:modelValue']);

function handleChange(e: any) {
  emit('update:modelValue', e.target.value);
}
</script>

<style scoped lang="scss">
.win-input {
  display: inline-block;
  position: relative;
  background-color: var(--color-white);
  border: var(--light-border);
  cursor: pointer;
  transition: all 0.2s;
  font-size: var(--ui-font-size);
  width: calc(var(--ui-button-width) * 2);
  height: var(--ui-button-height);
  border-width: 1px;
  box-sizing: border-box;
  padding: 0;
  // &:hover {
  //     border-width: 1px;
  //     border-color: var(--color-blue);
  // }
}

.win-input input {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  // padding: 6px 12px;
  border: none;
  background-color: transparent;
  font-size: 14px;
  color: #333;
  outline: none;
}

.win-input input:focus {
  box-shadow: 0 0 0 1px var(--color-blue);
  // border-width: 1px;
  // border-color: var(--color-blue);
}
</style>
