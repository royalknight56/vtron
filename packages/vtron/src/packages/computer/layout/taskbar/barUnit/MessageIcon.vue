<template>
  <span class="SEGOEUIMDL bubble" aria-hidden="true">{{ unread ? '\uE7E7' : '\uE91C' }}</span>
  <span v-if="unread" class="count" aria-hidden="true">{{ unread > 99 ? '99+' : unread }}</span>
</template>
<script setup lang="ts">
defineProps<{ unread: number }>();
</script>
<style scoped>
.bubble {
  width: 20px;
  font-size: 18px;
  line-height: 1;
}
.count {
  position: absolute;
  right: 3px;
  bottom: 4px;
  min-width: 12px;
  padding: 0 2px;
  border: 1px solid var(--theme-main-color);
  border-radius: 8px;
  background: #333;
  color: #fff;
  font:
    10px/12px 'Segoe UI',
    sans-serif;
}
</style>
