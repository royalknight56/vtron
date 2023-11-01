<template>
  <div class="state-group">
    <div class="error">
      <Error></Error>
    </div>
    <div class="state-item battery">
      <Battery></Battery>
    </div>
    <div class="state-item network">
      <NetWork></NetWork>
    </div>
    <div @click="handleClick" class="state-item datetime">
      <DateTime></DateTime>
    </div>
    <div @click="handleNotifyClick" class="state-item">
      <MessageIcon></MessageIcon>
    </div>
    <div class="showdesk"></div>
  </div>
</template>
<script setup lang="ts">
import { emitEvent } from '@feature/event';
import Battery from './Battery.vue';
import DateTime from './DateTime.vue';
import NetWork from './NetWork.vue';
import MessageIcon from './MessageIcon.vue';
import Error from './Error.vue';

function handleClick() {
  emitEvent('datetime.show');
}
function handleNotifyClick() {
  emitEvent('messagecenter.show');
}
</script>
<style lang="scss" scoped>
.state-group {
  display: flex;
  align-items: center;
  user-select: none;
  .state-item {
    padding: 0 8px;
    height: 100%;
    display: flex;
    align-items: center;
  }
  .state-item:hover {
    background-color: rgba(255, 255, 255, 0.519);
  }
  .error {
    padding: 0 8px;
    height: 100%;
    display: flex;
    align-items: center;
  }
}
.showdesk {
  width: 6px;
  height: 100%;
  border-left: 1px solid rgba(0, 0, 0, 0.222);
}
</style>
