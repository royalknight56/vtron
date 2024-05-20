<template>
  <div class="notify">
    <TransitionGroup name="list" tag="div">
      <div class="notify-item" v-for="notify in notifyGroup.current" :key="notify.id" v-glowing>
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
import { vGlowing } from '@/packages/util/glowingBorder';
import { System } from '@packages/kernel';
import { inject } from 'vue';
const sys = inject<System>('system')!;
const notifyGroup = sys.stateManager.notify;
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
    background-color: var(--theme-main-color-opacity);
    transition: all 0.3s ease;
    .notify-item-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
      color: black;
    }

    .notify-item-body {
      font-size: 14px;
      color: black;
    }
  }
  .notify-item:hover {
    // transform: scale(1.05);
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
../../kernel/system
