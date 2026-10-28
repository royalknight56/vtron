<script setup lang="ts">
defineProps<{
  name: 'back' | 'forward' | 'reload' | 'home' | 'globe' | 'plus' | 'close' | 'settings' | 'external';
}>();

const paths = {
  back: 'm14 6-6 6 6 6M8 12h13',
  forward: 'm10 6 6 6-6 6M16 12H3',
  reload: 'M20 7v5h-5M19.2 12a7.3 7.3 0 1 0-1.7 4.8M20 12l-3-4',
  home: 'm3 11 9-8 9 8M5 9v11h5v-6h4v6h5V9',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M18 6 6 18',
  settings: 'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  external: 'M14 3h7v7M21 3l-11 11M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5',
};
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="paths[name]" />
  </svg>
</template>

<style scoped>
svg { display: block; width: 18px; height: 18px; flex-shrink: 0; }
</style>
