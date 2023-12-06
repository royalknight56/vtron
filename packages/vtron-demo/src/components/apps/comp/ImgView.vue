<template>
  <img v-if="small" :src="iconimg || ''" :alt="alt" />
  <img v-else :src="iconimg || ''" :alt="alt" style="width: 100%" />
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useSystem } from 'vtron';
const sys = useSystem();
const props = defineProps<{
  src: string;
  alt: string;
  small?: boolean;
}>();

async function getImg(path: string) {
  return await sys.fs.readFile(path);
}
const iconimg = ref(await getImg(props.src));
</script>
