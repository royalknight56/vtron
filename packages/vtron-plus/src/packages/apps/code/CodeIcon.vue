<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="paths[name] || paths.file" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ name: string }>();
const paths: Record<string, string> = {
  files: 'M8 3h10l3 3v14H8z M3 7v14h11 M17 3v5h4',
  file: 'M6 3h9l4 4v14H6z M14 3v5h5',
  folder: 'M3 6h7l2 2h9v12H3z',
  folderOpen: 'M3 8V5h7l2 2h8v3 M3 10h19l-4 10H3z',
  search: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15 M16 16l5 5',
  plus: 'M12 4v16 M4 12h16',
  newFile: 'M14 3H5v18h14V8 M14 3v5h5 M8 14h8 M12 10v8',
  newFolder: 'M3 6h7l2 2h9v12H3z M15 11v6 M12 14h6',
  collapse: 'M8 3h13v13 M3 8h13v13H3z M6 14h7',
  refresh: 'M20 8a8 8 0 1 0 0 8 M20 3v5h-5',
  chevron: 'm9 5 7 7-7 7',
  close: 'm6 6 12 12 M18 6 6 18',
  save: 'M4 3h13l4 4v14H3V3z M7 3v6h9V3 M7 21v-8h10v8',
  theme: 'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z',
  check: 'm5 12 4 4L19 6',
  code: 'm8 5-7 7 7 7 M16 5l7 7-7 7 M14 3l-4 18',
  format: 'M4 5h16 M4 10h11 M4 15h7 M15 14l3-3 3 3 M18 11v10',
  arrow: 'M19 12H5 m6-6-6 6 6 6',
  run: 'm7 4 14 8-14 8V4Z',
  terminal: 'm4 5 7 7-7 7 M13 19h7',
  clear: 'M4 7h16 M9 7V4h6v3 M6 7l1 14h10l1-14 M10 11v6 M14 11v6',
};
</script>

<style scoped>
svg { width: 18px; height: 18px; flex-shrink: 0; }
</style>
