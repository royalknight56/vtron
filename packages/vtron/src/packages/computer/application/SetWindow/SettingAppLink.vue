<template>
  <button v-if="app" class="settings-link" type="button" @click="openRegisteredApp(system, app)">
    <slot>{{ name }}</slot>
  </button>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { System } from '@packages/kernel';
import { openRegisteredApp } from '@/packages/computer/utils/openRegisteredApp';

const props = defineProps<{ name: string; location?: 'Menulist' | 'Group' | 'Desktop' }>();
const system = inject<System>('system')!;
const app = computed(() => system.stateManager.windowMap.get(props.location ?? 'Menulist', props.name));
</script>
