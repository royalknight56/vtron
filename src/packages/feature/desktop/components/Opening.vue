<template>
  <div class="loading">
    <WinLogo></WinLogo>
    <div id="text"></div>
    <WinLoading></WinLoading>
  </div>
</template>
<script lang="ts" setup>
import WinLoading from '@packages/components/WinLoading.vue';
import WinLogo from '@packages/components/WinLogo.vue';
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
