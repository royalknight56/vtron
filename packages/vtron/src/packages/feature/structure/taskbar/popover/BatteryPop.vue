<template>
  <div class="battery">
    <div class="b-icon">
      <span class="segoicon SEGOEUIMDL charging">{{ iconDisplay }}</span>
      <span>充电中</span>
    </div>
    <div class="ch-text">
      {{ props.system.info.battery.chargeLevel * 100 }} %
      <div class="pro">
        <WinProcess :model-value="props.system.info.battery.chargeLevel * 100"></WinProcess>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { useRootState } from '@feature/state/Root';
import WinProcess from '@/packages/components/WinProcess.vue';

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
const props = useRootState();
watchEffect(() => {
  if (props.system.info.battery.chargeLevel == 1) {
    iconDisplay.value = charMap[`noC`][9];
  } else {
    const level = Math.floor(props.system.info.battery.chargeLevel * 10);
    iconDisplay.value = charMap[props.system.info.battery.isCharging ? `isC` : `noC`][level];
  }
});
</script>
<style lang="scss" scoped>
.battery {
  width: 100%;
  height: 100%;
  background-color: #ededed;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding-left: 30px;
  border: 1px solid #9c9c9c;
  box-sizing: border-box;
}
.b-icon {
  //   font-size: 34px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.ch-text {
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 5px;
}
.pro {
  width: 100px;
  height: 5px;
  margin-left: 5px;
}
.charging {
  font-size: 34px;
}
</style>
