<template>
  <div class="outer">
    <div class="icon">
      <span v-if="sysInfo.connection.rtt > 0" class="segoicon SEGOEUIMDL">&#xE839;</span>
      <span v-else class="segoicon SEGOEUIMDL">&#xEB55;</span>
    </div>
    <div class="info">
      <div class="speed">
        <span>{{ sysInfo.connection.downlink }} Mbps</span>
      </div>
      <div class="type">
        <span>{{ sysInfo.connection.effectiveType }}</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useSystem } from '@packages/kernel';
const rootState = useSystem()._rootState;
const sysInfo = rootState.info;
</script>
<style lang="scss" scoped>
.outer {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ededed;
  border: 1px solid #9c9c9c;
  box-sizing: border-box;
  .icon {
    width: 20px;
    height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    margin-left: 15px;
    .speed {
      font-size: 12px;
      color: #000;
    }
    .type {
      font-size: 10px;
      color: #000;
    }
  }
}
</style>
@/packages/kernel/system