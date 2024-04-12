<template>
  <div class="outer">
    <div class="tip">详细信息</div>
    <div class="time">
      {{ time.getFullYear() }}年{{ time.getMonth() + 1 }}月{{ time.getDate() }}日 {{ time.getHours() }}:{{
        time.getMinutes()
      }}
    </div>
    <div class="text">{{ win.config.text }}</div>
  </div>
</template>
<script setup lang="ts">
import { inject } from 'vue';
import { BrowserWindow } from '@packages/ui';

const win = inject<BrowserWindow>('browserWindow')!;
const day = new Date(win.config.day);
day.setHours(new Date(win.config.time).getHours());
day.setMinutes(new Date(win.config.time).getMinutes());
const time = day;
</script>
<style lang="scss" scoped>
.outer {
  display: flex;
  flex-direction: column;
  //   align-items: center;
  justify-content: flex-start;
  height: 100%;
  background-color: #f5f5f5;
}

.tip {
  padding: 6px 20px;
  font-size: 12px;
}

.time {
  margin-top: 2px;
  font-size: 16px;
  color: #1c1c1c;
  padding: 4px 20px;
}

.text {
  margin-top: 6px;
  overflow: auto;
  padding: 0 20px;
  margin: 10px;
  height: 100%;
  word-break: break-all;
  //   font-size: 24px;
  //   font-weight: bold;
  color: #1c1c1c;
  border: 1px solid #3636364e;
  background-color: white;
  transition: all 0.1s;
}

.text:hover {
  border: 1px solid #363636;
}
</style>
