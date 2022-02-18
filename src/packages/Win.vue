<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-02-07 16:35:03
 * @Description: 
 * @FilePath: /myindex/src/components/win.vue
-->
<template>
  <div @contextmenu.prevent class="win_outer" id="win10id">
    
    <TaskBar></TaskBar>
    <ContextMenu></ContextMenu>
    <Desktop></Desktop>
    <BlueScreen></BlueScreen>
    <AlertVue></AlertVue>
    <WindowsGroup></WindowsGroup>
    <!-- <LockScreenVue></LockScreenVue> -->
    
  </div>
</template>
  
  <script lang="ts" setup>

import { onMounted } from 'vue';

import TaskBar from './window/structure/TaskBar.vue';
import ContextMenu from './window/structure/ContextMenu.vue';
import Desktop from './window/structure/Desktop.vue';

import BlueScreen from './window/structure/BlueScreen.vue';
import WindowsGroup from './window/structure/WindowsGroup.vue';
import LockScreenVue from './window/structure/LockScreen.vue';
import AlertVue from './window/structure/Alert.vue';

import { SystemStatus } from './window/libs/SystemStatus';


onMounted(() => {
  SystemStatus.getInstance().openPower()
})

</script>
  <style>
.win_outer {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
  
