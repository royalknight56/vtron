<template>
  <img v-if="icon" draggable="false" :src="iconR" @error="replaceIcon" />
  <img v-else draggable="false" :src="iconimg" @error="replaceIcon" />
</template>
<script setup lang="ts">
import { System, VtronFileWithoutContent } from '@packages/kernel';
import { dealIcon } from '@/packages/computer/utils/dealIcon';
import unknownicon from '@packages/assets/unknown.png';
import { inject, onMounted, ref } from 'vue';
const props = defineProps<{
  file?: VtronFileWithoutContent | null;
  icon?: string;
}>();

const sys = inject<System>('system')!;
const iconimg = ref('');
const iconR = ref(props.icon);

onMounted(async () => {
  iconimg.value = await dealIcon(props.file, sys);
});
function replaceIcon() {
  iconR.value = unknownicon;
  iconimg.value = unknownicon;
}
</script>
