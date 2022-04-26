<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-04-26 11:21:56
 * @Description: 
 * @FilePath: /myindex/src/components/win.vue
-->
<template>
  <div @contextmenu.prevent class="win_outer SEGOEUI" id="win10id">
    <TaskBar></TaskBar>
    <ContextMenu></ContextMenu>
    <Desktop></Desktop>
    <BlueScreen></BlueScreen>
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

import BlueScreen from '@structure/BlueScreen.vue';
import WindowsGroup from '@structure/WindowsGroup.vue';
import LockScreenVue from '@structure/LockScreen.vue';
import AlertVue from '@structure/Alert.vue';

import { SystemStatus } from '@libs/SystemStatus';


onMounted(() => {
  console.log('windows10 in vue3 欢迎访问：')
  console.log('https://github.com/royalknight56/win10-vue3')
  SystemStatus.getInstance().openPower()
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
  
