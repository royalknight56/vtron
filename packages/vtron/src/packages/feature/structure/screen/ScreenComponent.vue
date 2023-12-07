<template>
  <div class="screen" @contextmenu.prevent ref="screen" :style="rootState?.system?.options?.rootStyle">
    <template v-if="rootState.system.state == SystemStateEnum.close">
      <CloseDesktop></CloseDesktop>
    </template>
    <template v-else-if="rootState.system.state == SystemStateEnum.opening">
      <OpeningDesktop></OpeningDesktop>
    </template>
    <template
      v-else-if="
        rootState.system.state == SystemStateEnum.open || rootState.system.state == SystemStateEnum.lock
      "
    >
      <Transition name="moveup">
        <div class="login" v-if="rootState.system.state == SystemStateEnum.lock">
          <LockDesktop> </LockDesktop>
        </div>
      </Transition>
      <Transition name="fadeout">
        <DesktopBackground
          v-if="rootState.system.state == SystemStateEnum.lock"
          class="mask"
        ></DesktopBackground>
      </Transition>
      <OpenDesktop v-if="rootState.system.state == SystemStateEnum.open"></OpenDesktop>
    </template>
  </div>
</template>
<script lang="ts" setup>
import CloseDesktop from '@feature/structure/desktop/CloseDesktop.vue';
import OpenDesktop from '@feature/structure/desktop/OpenDesktop.vue';
import OpeningDesktop from '@feature/structure/desktop/OpeningDesktop.vue';
import LockDesktop from '@feature/structure/desktop/LockDesktop.vue';
import DesktopBackground from '@feature/structure/desktop/components/DesktopBackground.vue';

import { SystemStateEnum } from '@packages/type/enum';
import { useRootState } from '@feature/state/Root';

const rootState = useRootState();
</script>
<style lang="scss" scoped>
@import '@packages/root.scss';

.screen {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
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
* {
  font-family: 'SEGOEUIMDL', 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Helvetica, Arial, sans-serif;
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
</style>
