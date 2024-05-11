<template>
  <div
    class="screen"
    @contextmenu.prevent
    ref="screenref"
    :style="system.stateManager.options.getOptions('rootStyle')"
  >
    <template v-if="rootState.systemState == SystemStateEnum.close">
      <CloseDesktop></CloseDesktop>
    </template>
    <template v-else-if="rootState.systemState == SystemStateEnum.opening">
      <OpeningDesktop></OpeningDesktop>
    </template>
    <template
      v-else-if="
        rootState.systemState == SystemStateEnum.open || rootState.systemState == SystemStateEnum.lock
      "
    >
      <Transition name="moveup">
        <div class="login" v-if="rootState.systemState == SystemStateEnum.lock">
          <LockDesktop> </LockDesktop>
        </div>
      </Transition>
      <Transition name="fadeout">
        <DesktopBackground
          v-if="rootState.systemState == SystemStateEnum.lock"
          class="mask"
        ></DesktopBackground>
      </Transition>
      <DesktopLayout v-if="rootState.systemState == SystemStateEnum.open"></DesktopLayout>
    </template>
  </div>
</template>

<script lang="ts" setup>
import CloseDesktop from '@packages/ui/desktop/CloseDesktop.vue';
import DesktopLayout from '@packages/ui/desktop/DesktopLayout.vue';
import OpeningDesktop from '@packages/ui/desktop/OpeningDesktop.vue';
import LockDesktop from '@packages/ui/desktop/LockDesktop.vue';
import DesktopBackground from '@packages/ui/desktop/components/DesktopBackground.vue';

import { SystemStateEnum } from '@packages/type/enum';
import { System, useSystem } from '@packages/kernel';
import { onMounted, ref } from 'vue';
const screenref = ref();
defineProps<{
  system: System;
}>();
onMounted(() => {
  useSystem().rootRef = screenref.value;
});
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
