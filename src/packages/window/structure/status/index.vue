<!--
 * @Author: Royal
 * @LastEditTime: 2022-05-29 16:13:11
 * @Description: 
-->
<template>
  <div class="status-outer">
    <BlackScreen v-if="stat.screen == 'close'"></BlackScreen>
    <BlueScreen v-if="stat.screen == 'blue'"></BlueScreen>
  </div>
</template>
<script lang="ts" setup>
import { appconfig } from "@/packages/appconfig";
import { SystemState } from "@libs/SystemState";
import BlackScreen from '@structure/status/black.vue';
import BlueScreen from '@structure/status/blue.vue';

let stat = SystemState.getInstance().state;

// import Background from '@structure/background/background.vue';



</script>