<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:40:07
 * @Description: 
-->
<template>
  <div class="status-outer">
    <BlackScreen v-if="stat.screen == 'close'"></BlackScreen>
    <BlueScreen v-if="stat.screen == 'blue'"></BlueScreen>
  </div>
</template>
<script lang="ts" setup>
import BlackScreen from '@structure/status/black.vue';
import BlueScreen from '@structure/status/blue.vue';
import {System} from '@libs/System'
import { inject } from "vue";
let system = <System>inject('system')
let stat = system.Power.state;

// import Background from '@structure/background/background.vue';



</script>