<template>
  <div class="notify">
    <TransitionGroup name="list" tag="div">
      <div class="notify-item" v-for="notify in notifyGroup" :key="notify.id">
        <div class="notify-item-title">
          <span> {{ notify.title }}</span>
        </div>
        <div class="notify-item-body">
          <span>{{ notify.content }}</span>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>
<script setup lang="ts">
import { useSystem } from '../system';

const notifyGroup = useSystem()._rootState.system.notify;
</script>
<style lang="scss" scoped>
.notify {
  position: absolute;
  bottom: 0;
  right: 0;
  // height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  user-select: none;
  color: rgba(255, 255, 255, 0.845);
  z-index: 100;
  .notify-item {
    width: var(--notify-width);
    height: var(--notify-height);
    position: relative;
    padding: 18px;
    margin-bottom: 10px;
    background-color: var(--color-notify);
    transition: all 0.3s ease;
    .notify-item-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .notify-item-body {
      font-size: 14px;
    }
  }
  .notify-item:hover {
    transform: scale(1.05);
  }

  .list-move,
    /* apply transition to moving elements */
    .list-enter-active,
    .list-leave-active {
    transition: all 0.5s ease;
  }

  .list-enter-from,
  .list-leave-to {
    opacity: 0;
    transform: translateX(30px);
  }

  /* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
  .list-leave-active {
    position: absolute;
  }
}
</style>
