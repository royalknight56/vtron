<template>
  <div class="file-group-icon">
    <div v-for="item in groupContent" :key="item.name" class="file-group-icon-item">
      <VtronImage :path="item.icon" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { WinAppOptions } from '@/packages/type/type';
import { VtronFileWithoutContent } from '@packages/kernel';
import { inject, onMounted, ref } from 'vue';
import { System } from '@packages/kernel';
import VtronImage from './VtronImage.vue';
const sys = inject<System>('system')!;
const props = defineProps<{
  file?: VtronFileWithoutContent | null;
}>();
const groupContent = ref<WinAppOptions[]>([]);
onMounted(async () => {
  try {
    const file = await sys.fs.readFile(props.file?.path || '');
    if (file) {
      groupContent.value = JSON.parse(file);
    }
  } catch (error) {
    console.error(error);
  }
  // 补齐到9个
  if (groupContent.value.length < 9) {
    groupContent.value = groupContent.value.concat(Array(9 - groupContent.value.length).fill({}));
  } else if (groupContent.value.length > 9) {
    groupContent.value = groupContent.value.slice(0, 9);
  }
});
</script>
<style scoped>
.file-group-icon {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  position: relative;
  width: 48px;
  height: 48px;
  border: 2px dashed #ccc;
  border-radius: 10px;
  background-color: #f0f0f02f;
}
.file-group-icon-item {
  display: block;
  position: relative;
  width: 16px;
  height: 16px;
}
</style>
