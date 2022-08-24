<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 18:38:04
 * @Description: 
-->
<template>
  <span v-if="sysInfo.connection > 0" class="segoicon SEGOEUIMDL">&#xE839;</span>
  <span v-else class="segoicon SEGOEUIMDL">&#xEB55;</span>
</template>
<script setup lang="ts">
// import { sysInfo } from "@state/index";
import { defineProps } from 'vue';
import { PropType } from 'vue';

let props = defineProps(['sysInfo'])
</script>
<style scoped>
@import "@/packages/main.css";
</style>