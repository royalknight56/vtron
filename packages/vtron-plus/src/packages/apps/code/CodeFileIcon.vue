<template>
  <img v-if="icon" :src="icon" class="code-file-image" alt="" draggable="false" />
  <span v-else class="code-file-label" :class="fileColor(name)" aria-hidden="true">{{ fileLabel(name) }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { codeFileIcon } from './fileIcons';
import { fileColor, fileLabel } from './filePresentation';
const props = defineProps<{ name: string }>();
const icon = computed(() => codeFileIcon(props.name));
</script>

<style scoped>
.code-file-image { width: 16px; height: 16px; object-fit: contain; flex-shrink: 0; }
.code-file-label { display: inline-block; width: 16px; flex-shrink: 0; text-align: center; font: 600 11px Consolas, monospace; color: #9ca4ac; }
.yellow { color: #d7ba7d; }.blue { color: #519aba; }.green { color: #41b883; }.orange { color: #e37933; }.purple { color: #b180d7; }
</style>
