<template>
  <div class="date-time">
    <span class="time">{{ timeDisplay }}</span>
    <span class="date">{{ dateDisplay }}</span>
  </div>
</template>
<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { useRootState } from '../../state/Root';

let timeDisplay = ref(`00:00`);
let dateDisplay = ref(`0000-00-00`);

setInterval(() => {
  let date = new Date();
  let time = `${date.getHours()}:${date.getMinutes()}`;
  let dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  timeDisplay.value = time;
  dateDisplay.value = dateStr;
}, 5000);
</script>
<style lang="scss" scoped>
.date-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .time {
    font-size: 12px;
  }

  .date {
    font-size: 12px;
  }
}
</style>
