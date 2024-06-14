<template>
  <ColorPicker :visible-formats="['hex']" :color="color" @color-change="throttleFunc"> </ColorPicker>
</template>
<script setup lang="ts">
import { throttle } from '@/packages/util/debounce';
import { ref } from 'vue';
import { ColorPicker } from 'vue-accessible-color-picker';

const prop = defineProps({
  modelValue: {
    type: String,
    default: '#000000',
  },
});
const emit = defineEmits(['update:modelValue']);
const color = ref(prop.modelValue);
const updateColor = (color: any) => {
  emit('update:modelValue', color.colors.hex);
};
const throttleFunc = throttle(updateColor, 200);
</script>
<style>
@import url('vue-accessible-color-picker/styles');
</style>
