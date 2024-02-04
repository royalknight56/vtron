<template>
  <template v-if="rootState">
    <ScreenContent :root-state="rootState"> </ScreenContent>
  </template>
</template>
<script lang="ts" setup>
import { Bios, System, useSystem } from '@packages/kernel';
import { ref } from 'vue';
import { RootState } from '@packages/kernel';
import ScreenContent from './ScreenContent.vue';

const screenref = ref();
const rootState = ref<RootState | undefined>(useSystem()?._rootState);
Bios.onOpen((system: System) => {
  rootState.value = system._rootState;
  system.rootRef = screenref.value;
});
</script>
<style lang="scss" scoped>
@import '@packages/root.scss';
</style>
<style>
@font-face {
  font-family: 'SEGOEUIMDL';
  src: url('SegMDL2.ttf') format('truetype');
  /* chrome、firefox、opera、Safari, Android, iOS 4.2+ */
  /* url("LXGWWenKai-Bold.svg#LXGWWenKai-Bold") format("svg"); iOS 4.1- */
  font-style: normal;
  font-weight: normal;
}

.SEGOEUIMDL {
  font-family: 'SEGOEUIMDL';
  font-style: normal;
  font-weight: normal;
}
.moveup-enter-active {
  transition: all 1s var(--aniline);
}
.moveup-leave-active {
  transition: all 1s;
}

.moveup-enter-to,
.moveup-leave-from {
  opacity: 1;
  transform: translateY(0%);
}

.moveup-enter-from,
.moveup-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.login {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1001;
}
.mask {
  position: absolute;
  z-index: 1000;
}
.fadeout-enter-active {
  transition: all 1s var(--aniline);
}
.fadeout-leave-active {
  transition: all 1s;
}

.fadeout-enter-to,
.fadeout-leave-from {
  opacity: 1;
}

.fadeout-enter-from,
.fadeout-leave-to {
  opacity: 0;
}
.glowing-hover {
  /* box-sizing: border-box; */
}
.glowing-hover-child {
  mask-repeat: no-repeat;
  mask-image: radial-gradient(circle at center, transparent 0%, transparent 80%);
  position: absolute;
  width: calc(100% + 2px);
  height: calc(100% + 2px);
  left: -1px;
  top: -1px;
  background-color: white;
  will-change: color;
  z-index: -2;
  transition: all 0.1s;
}
.glowing-hover-mask {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  z-index: -1;
  background-color: inherit;
}
.glowing-hover:hover .glowing-hover-child {
  mask-image: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.714) 0%,
    rgba(255, 255, 255, 0.614) 20%,
    transparent 80%
  );
}
</style>
@/packages/kernel/system@/packages/kernel/state/Root