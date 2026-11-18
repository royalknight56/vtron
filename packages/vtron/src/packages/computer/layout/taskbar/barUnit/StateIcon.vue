<template>
  <div class="state-group">
    <div class="error">
      <Error></Error>
    </div>
    <CustomIcon></CustomIcon>
    <button
      v-if="showMessageCenter"
      type="button"
      class="state-item action-center-button"
      :aria-expanded="notifications.center.open"
      :aria-label="buttonLabel"
      :title="buttonLabel"
      @click="handleNotifyClick"
    >
      <MessageIcon :unread="notifications.unread" />
    </button>
    <div @click="showDesk" class="showdesk"></div>
  </div>
</template>
<script setup lang="ts">
import { System } from '@packages/kernel';

import MessageIcon from './MessageIcon.vue';
import Error from './Error.vue';

import CustomIcon from './CustomIcon.vue';
import { i18n } from '../../../i18n';
import { computed, inject } from 'vue';

const sys = inject<System>('system')!;
const notifications = sys.stateManager.notify;
const buttonLabel = computed(
  () =>
    i18n('center.title') +
    ' · ' +
    (notifications.unread
      ? i18n('center.unread').replace('{n}', String(notifications.unread))
      : i18n('no.message'))
);
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
  button.state-item {
    position: relative;
    border: 0;
    background: transparent;
    color: inherit;
  }
  .state-item[aria-expanded='true'],
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
