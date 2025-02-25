<template>
  <Transition name="fade">
    <div v-if="isPopShow" class="message-center scroll-bar" @mousedown.stop="">
      <ClockTime></ClockTime>
      <CalendarTime></CalendarTime>
      <WeatherTool></WeatherTool>
      <NoteScheduler></NoteScheduler>
      <NotifyCenter></NotifyCenter>
    </div>
  </Transition>
</template>
<script setup lang="ts">
import { System } from '@packages/kernel';
import { inject, ref } from 'vue';
import ClockTime from './components/ClockTime.vue';
import NotifyCenter from './components/NotifyCenter.vue';
import CalendarTime from './components/CalendarTime.vue';
import WeatherTool from './components/WeatherTool.vue';
import NoteScheduler from './components/NoteScheduler.vue';
const sys = inject<System>('system')!;
const rootState = sys.stateManager;

const isPopShow = ref(false);
sys.mountEvent('messagecenter.show', () => {
  isPopShow.value = !isPopShow.value;
});
sys.mountEvent('messagecenter.hidden', () => {
  isPopShow.value = false;
});

</script>
<style lang="scss" scoped>
@import '@packages/assets/main.scss';

.message-center {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  padding: 10px;
  z-index: 400;
  background-color: var(--color-gray);
  border-left: 1px solid #ccc;
  overflow-y: auto;
  user-select: none;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s var(--aniline);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateX(0px);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
