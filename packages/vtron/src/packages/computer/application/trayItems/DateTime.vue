<template>
  <div class="date-time">
    <span class="time">{{ display.time }}</span>
    <span class="date">{{ display.date }}</span>
  </div>
</template>
<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue';
import { System } from '@packages/kernel';
import { formatDesktopClock } from '@/packages/computer/utils/desktopClock';

const system = inject<System>('system')!;
const now = ref(new Date());
const display = computed(() => formatDesktopClock(now.value, system.getConfig('desktopPreferences')));
let timer: ReturnType<typeof setInterval>;
onMounted(() => {
  timer = setInterval(() => { now.value = new Date(); }, 1000);
});
onUnmounted(() => clearInterval(timer));
</script>
<style lang="scss" scoped>
.date-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 16px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;

  .time {
    font-size: 12px;
  }

  .date {
    font-size: 12px;
  }
}
</style>
