<!--
 * @Author: Royal
 * @LastEditTime: 2022-06-01 10:15:29
 * @Description: 
 * @FilePath: /myindex/src/components/win.vue
-->
<template>
  <div @contextmenu.prevent class="win_outer SEGOEUI" id="win10id">
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

onMounted(()=>{
  globalInit()
})

</script>
<style scoped>
@import './main.css';

</style>
<style>
.win_outer {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
  
