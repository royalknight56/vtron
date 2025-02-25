<template>
  <div class="state-group">
    <div class="error">
      <Error></Error>
    </div>
    <CustomIcon></CustomIcon>
    <div @click="handleNotifyClick" v-if="showMessageCenter" class="state-item">
      <MessageIcon></MessageIcon>
    </div>
    <div @click="showDesk" class="showdesk"></div>
  </div>
</template>
<script setup lang="ts">
import { System } from '@packages/kernel';

import MessageIcon from './MessageIcon.vue';
import Error from './Error.vue';

import CustomIcon from './CustomIcon.vue';
import { inject } from 'vue';

const sys = inject<System>('system')!;
const feature = sys._options.builtinFeature;
const showMessageCenter = feature?.includes('MessageCenter');
function handleNotifyClick() {
  sys.emitEvent('messagecenter.show');
}
function showDesk() {
  sys.stateManager.windowTree.windowOrder.forEach((win) => {
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
@/packages/kernel/event
