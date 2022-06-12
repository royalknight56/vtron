<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-06-02 15:09:03
 * @Description: 
-->
<template>
  <span v-if="sysInfo.connection > 0" class="segoicon SEGOEUIMDL">&#xE839;</span>
  <span v-else class="segoicon SEGOEUIMDL">&#xEB55;</span>
</template>
<script setup lang="ts">
import { sysInfo } from "@state/index";
</script>
<style scoped>
@import "@/packages/main.css";
</style>