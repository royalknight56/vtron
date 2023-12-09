<template>
  <div class="state-group">
    <div class="error">
      <Error></Error>
    </div>
    <CustomIcon></CustomIcon>
    <div @click="handleNotifyClick" class="state-item">
      <MessageIcon></MessageIcon>
    </div>
    <div @click="showDesk" class="showdesk"></div>
  </div>
</template>
<script setup lang="ts">
import { emitEvent } from '@feature/event';

import MessageIcon from './MessageIcon.vue';
import Error from './Error.vue';
import { useSystem } from '@/packages/plug';
import CustomIcon from './CustomIcon.vue';
const sys = useSystem();

function handleNotifyClick() {
  emitEvent('messagecenter.show');
}
function showDesk() {
  sys._rootState.system.windowOrder.forEach((win) => {
    win.minimize();
  });
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
  cursor: pointer;
  border-left: 1px solid rgba(0, 0, 0, 0.222);
}
.showdesk:hover {
  background-color: rgba(255, 255, 255, 0.519);
  box-shadow: 0 0 10px 10px rgba(255, 255, 255, 0.222);
}
</style>
