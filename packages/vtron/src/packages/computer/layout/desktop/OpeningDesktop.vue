<template>
  <div class="loading">
    <WinLogo></WinLogo>
    <div id="text"></div>
    <WinLoading></WinLoading>
    <button v-if="isEmergencyRepair" @click="emergencyRepair">长时间无法开机？点击紧急恢复</button>
  </div>
</template>
<script lang="ts" setup>
import { System } from '@/packages/kernel';
import WinLoading from '@packages/components/WinLoading.vue';
import WinLogo from '@packages/components/WinLogo.vue';
import { inject, onMounted, ref } from 'vue';

const isEmergencyRepair = ref(false);
const sys = inject<System>('system')!;
onMounted(() => {
  setTimeout(() => {
    isEmergencyRepair.value = true;
  }, 10000);
});

function emergencyRepair() {
  localStorage.clear();
  window.indexedDB.deleteDatabase('FileSystemDB' + sys.id);
  window.location.reload();
}
</script>
<style scoped>
.loading {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgb(0, 119, 210);
  user-select: none;
}

#text {
  display: inline-block;
  position: absolute;
  width: 100%;
  text-align: center;
  top: 80%;
  color: azure;
  font-weight: 500;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
</style>
