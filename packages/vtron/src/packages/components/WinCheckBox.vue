<template>
  <div class="checkbox-outer">
    <input class="checkbox" type="checkbox" id="checkbox" v-model="checkedRef" />
    <label for="checkbox">
      <slot> </slot>
    </label>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
const checkedRef = ref(false);
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update:modelValue']);

watch(checkedRef, (val) => {
  emit('update:modelValue', val);
});
</script>
<style scoped lang="scss">
.checkbox-outer {
  display: flex;
  align-items: center;
  justify-content: center;
}
.checkbox {
  width: 20px;
  height: 20px;
}
</style>
