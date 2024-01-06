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
import CloseDesktop from '@feature/structure/desktop/CloseDesktop.vue';
import Desktop from '@feature/structure/desktop/Desktop.vue';
import OpeningDesktop from '@feature/structure/desktop/OpeningDesktop.vue';
import LockDesktop from '@feature/structure/desktop/LockDesktop.vue';
import DesktopBackground from '@feature/structure/desktop/components/DesktopBackground.vue';

import { SystemStateEnum } from '@packages/type/enum';
import { useSystem } from '@feature/system';
import { onMounted, ref } from 'vue';
import { RootState } from '@feature/state/Root';
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
