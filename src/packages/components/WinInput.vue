<template>
  <div class="win-input">
    <input type="text" :placeholder="placeholder" v-model="value" @change="" />
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Type here',
  },
});
let emit = defineEmits(['update:modelValue']);

const value = ref(props.modelValue);

watch(value, (nv, ov) => {
  emit('update:modelValue', nv);
});
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

.win-input input[type='text'] {
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

.win-input input[type='text']:focus {
  box-shadow: 0 0 0 1px var(--color-blue);
  // border-width: 1px;
  // border-color: var(--color-blue);
}
</style>
