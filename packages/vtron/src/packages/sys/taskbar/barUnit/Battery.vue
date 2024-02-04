<template>
  <span class="segoicon SEGOEUIMDL charging">{{ iconDisplay }}</span>
</template>
<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { useSystem } from '@packages/kernel';

const charMap = {
  noC: {
    0: `\uE850`,
    1: `\uE851`,
    2: `\uE852`,
    3: `\uE853`,
    4: `\uE854`,
    5: `\uE855`,
    6: `\uE856`,
    7: `\uE857`,
    8: `\uE858`,
    9: `\uE859`,
  } as Record<number, string>,
  isC: {
    0: `\uE85A`,
    1: `\uE85B`,
    2: `\uE85C`,
    3: `\uE85D`,
    4: `\uE85E`,
    5: `\uE85F`,
    6: `\uE860`,
    7: `\uE861`,
    8: `\uE862`,
    9: `\uE859`,
  } as Record<number, string>,
};
const iconDisplay = ref(`\uE850`);

watchEffect(() => {
  const rootState = useSystem()._rootState;
  if (rootState.info.battery.chargeLevel == 1) {
    iconDisplay.value = charMap[`noC`][9];
  } else {
    const level = Math.floor(rootState.info.battery.chargeLevel * 10);
    iconDisplay.value = charMap[rootState.info.battery.isCharging ? `isC` : `noC`][level];
  }
});
</script>
@/packages/kernel/system