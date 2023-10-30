<template>
  <img v-if="icon" draggable="false" :src="icon" />
  <img v-else draggable="false" :src="iconimg" />
</template>
<script setup lang="ts">
import { VtronFileWithoutContent } from '@feature/core/FileSystem';
import { useSystem } from '@feature/system';
import { dealIcon } from '@/packages/util/Icon';
const props = defineProps<{
  file?: VtronFileWithoutContent | null;
  icon?: string;
}>();

const sys = useSystem();
const iconimg = await dealIcon(props.file, sys);
</script>
