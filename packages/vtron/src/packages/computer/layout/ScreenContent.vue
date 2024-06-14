<template>
  <div
    class="screen"
    @contextmenu.prevent
    ref="screenref"
    :style="system.stateManager.options.getOptions('rootStyle')"
  >
    <template v-if="powerState === PowerStateEnum.close">
      <CloseDesktop></CloseDesktop>
    </template>
    <template v-else-if="powerState == PowerStateEnum.opening">
      <OpeningDesktop></OpeningDesktop>
    </template>
    <template v-else-if="powerState == PowerStateEnum.open || powerState == PowerStateEnum.lock">
      <Transition name="moveup">
        <div class="login" v-if="powerState == PowerStateEnum.lock">
          <LockDesktop> </LockDesktop>
        </div>
      </Transition>
      <Transition name="fadeout">
        <DesktopBackground v-if="powerState == PowerStateEnum.lock" class="mask"></DesktopBackground>
      </Transition>
      <DesktopLayout v-if="powerState == PowerStateEnum.open"></DesktopLayout>
    </template>
  </div>
</template>

<script lang="ts" setup>
import CloseDesktop from '@packages/computer/layout/desktop/CloseDesktop.vue';
import DesktopLayout from '@packages/computer/layout/DesktopLayout.vue';
import OpeningDesktop from '@packages/computer/layout/desktop/OpeningDesktop.vue';
import LockDesktop from '@packages/computer/layout/desktop/LockDesktop.vue';
import DesktopBackground from '@packages/computer/layout/desktop/components/DesktopBackground.vue';
import { PowerStateEnum } from '@/packages/kernel/state/subStates/PowerState';
import { System } from '@packages/kernel';
import { inject, onMounted, ref } from 'vue';

const screenref = ref();
const props = defineProps<{
  system: System;
}>();
const sys = inject<System>('system')!;
onMounted(() => {
  sys.rootRef = screenref.value;
});
const powerState = ref(props.system.stateManager.powerState.current);
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
