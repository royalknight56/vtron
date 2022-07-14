<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:31:05
 * @Description: 
 * @FilePath: /myindex/src/components/win.vue
-->
<template>
  <div @contextmenu.prevent class="win_outer SEGOEUI" :id="system.id">
    <TaskBar></TaskBar>
    <ContextMenu></ContextMenu>
    <Desktop></Desktop>
    <BackgroundVue></BackgroundVue>
    <StatusVue></StatusVue>
    <AlertVue></AlertVue>
    <WindowsGroup></WindowsGroup>
    <LockScreenVue></LockScreenVue>
  </div>
</template>
  
<script lang="ts" setup>

import { onMounted, provide } from 'vue';

import TaskBar from '@structure/TaskBar.vue';
import ContextMenu from '@structure/ContextMenu.vue';
import Desktop from '@structure/Desktop.vue';
import BackgroundVue from '@structure/background/index.vue';
import StatusVue from '@structure/status/index.vue';
import WindowsGroup from '@structure/WindowsGroup.vue';
import LockScreenVue from '@structure/LockScreen.vue';
import AlertVue from '@structure/Alert.vue';

import { globalInit } from './init'

import { System } from '@libs/System'
let props = defineProps({
  system: {
    type: System,
    required: true
  }
});
provide('system', props.system);
onMounted(() => {
  globalInit(props.system)
})

</script>
<style scoped>
@import "@/packages/main.css";
</style>
<style>
.win_outer {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
  
