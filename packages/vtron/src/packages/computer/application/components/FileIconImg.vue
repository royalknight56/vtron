<template>
  <div v-if="file?.name.endsWith('.group')" class="file-icon-img">
    <FileGroupIcon :file="file" />
  </div>
  <img v-else-if="icon" draggable="false" :src="iconR" @error="replaceIcon" />
  <img v-else draggable="false" :src="iconimg" @error="replaceIcon" />
</template>
<script setup lang="ts">
import { System, VtronFileWithoutContent } from '@packages/kernel';
import { dealIcon } from '@/packages/computer/utils/dealIcon';
import FileGroupIcon from './FileGroupIcon.vue';
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
  if (props.file?.name.endsWith('.group')) {
    return;
  } else {
    iconimg.value = await dealIcon(props.file, sys);
  }
});
function replaceIcon() {
  iconR.value = unknownicon;
  iconimg.value = unknownicon;
}
</script>
