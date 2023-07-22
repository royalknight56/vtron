<template>
  <div class="screen" @contextmenu.prevent ref="screen">
    <template v-if="rootState.system.state == SystemStateEnum.close">
      <CloseDesktop></CloseDesktop>
    </template>
    <template v-else-if="rootState.system.state == SystemStateEnum.opening">
      <OpeningDesktop></OpeningDesktop>
    </template>
    <template v-else-if="rootState.system.state == SystemStateEnum.open">
      <OpenDesktop></OpenDesktop>
    </template>
  </div>
</template>
<script lang="ts" setup>
import CloseDesktop from '@feature/desktop/CloseDesktop.vue';
import OpenDesktop from '@feature/desktop/OpenDesktop.vue';
import OpeningDesktop from '@feature/desktop/OpeningDesktop.vue';
import { SystemStateEnum } from '@packages/type/enum';
import { useRootState } from '@feature/state/Root';
import { onMounted, ref } from 'vue';

const rootState = useRootState();
const screen = ref<HTMLElement>();
onMounted(() => {
  rootState.ref = screen.value;
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
</style>
