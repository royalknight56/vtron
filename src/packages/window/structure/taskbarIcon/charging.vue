<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-06-02 15:14:20
 * @Description: 
-->
<template>
  <span class="segoicon SEGOEUIMDL charging">{{ iconDisplay }}</span>
</template>
<script setup lang="ts">
import { sysInfo } from "@state/index";

import { reactive, ref, watch } from "vue";
let charMap = {
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
  },
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
  }
}
let iconDisplay = ref(`\uE850`);
watch([
  () => sysInfo.isCharging,
  () => sysInfo.chargeLevel,
], (val) => {
  if (sysInfo.chargeLevel == 1) {
    iconDisplay.value = charMap[`noC`][9];
  } else {
    let level = Math.floor(sysInfo.chargeLevel * 10);
    iconDisplay.value = (charMap[sysInfo.isCharging ? `isC` : `noC`] as any)[level];
  }
})

</script>
<style scoped>
@import "@/packages/main.css";

.charging {
  width: 100px;
}
</style>