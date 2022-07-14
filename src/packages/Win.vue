<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 16:38:17
 * @Description: 
 * @FilePath: /myindex/src/components/win.vue
-->
<template>
  <div @contextmenu.prevent class="win_outer SEGOEUI" id="win10id">
    <TaskBar :system="system"></TaskBar>
    <ContextMenu :system="system"></ContextMenu>
    <Desktop :system="system"></Desktop>
    <BackgroundVue :system="system"></BackgroundVue>
    <StatusVue :system="system"></StatusVue>
    <AlertVue :system="system"></AlertVue>
    <WindowsGroup :system="system"></WindowsGroup>
    <LockScreenVue :system="system"></LockScreenVue>
  </div>
</template>
  
<script lang="ts" setup>

import { onMounted } from 'vue';

import TaskBar from '@structure/TaskBar.vue';
import ContextMenu from '@structure/ContextMenu.vue';
import Desktop from '@structure/Desktop.vue';
import BackgroundVue from '@structure/background/index.vue';
import StatusVue from '@structure/status/index.vue';
import WindowsGroup from '@structure/WindowsGroup.vue';
import LockScreenVue from '@structure/LockScreen.vue';
import AlertVue from '@structure/Alert.vue';

import {globalInit} from './init'

import {System} from '@libs/System'
let props = defineProps({
  system:{
    type:System,
    required:true
  }
});
console.log(props)
onMounted(()=>{
  globalInit()
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
  
