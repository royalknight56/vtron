<template>
  <div class="screen" @contextmenu.prevent ref="screenref" :style="rootState?.options?.rootStyle">
    <template v-if="rootState.state == SystemStateEnum.close">
      <CloseDesktop></CloseDesktop>
    </template>
    <template v-else-if="rootState.state == SystemStateEnum.opening">
      <OpeningDesktop></OpeningDesktop>
    </template>
    <template v-else-if="rootState.state == SystemStateEnum.open || rootState.state == SystemStateEnum.lock">
      <Transition name="moveup">
        <div class="login" v-if="rootState.state == SystemStateEnum.lock">
          <LockDesktop> </LockDesktop>
        </div>
      </Transition>
      <Transition name="fadeout">
        <DesktopBackground v-if="rootState.state == SystemStateEnum.lock" class="mask"></DesktopBackground>
      </Transition>
      <Desktop v-if="rootState.state == SystemStateEnum.open"></Desktop>
    </template>
  </div>
</template>

<script lang="ts" setup>
import CloseDesktop from '@packages/ui/desktop/CloseDesktop.vue';
import Desktop from '@packages/ui/desktop/Desktop.vue';
import OpeningDesktop from '@packages/ui/desktop/OpeningDesktop.vue';
import LockDesktop from '@packages/ui/desktop/LockDesktop.vue';
import DesktopBackground from '@packages/ui/desktop/components/DesktopBackground.vue';

import { SystemStateEnum } from '@packages/type/enum';
import { useSystem } from '@packages/kernel';
import { onMounted, ref } from 'vue';
import { RootState } from '@packages/kernel';
const screenref = ref();
defineProps<{
  rootState: RootState;
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
@/packages/kernel/system@/packages/kernel/state/Root
