<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-12-16 19:51:13
 * @Description: 
 * @FilePath: /myindex/src/components/win.vue
-->
<template>
  <div class="win_outer" id="winid">
    
    <TaskBar></TaskBar>
    <ContextMenu></ContextMenu>
    <Desktop></Desktop>
    <Bluescen></Bluescen>
    <WindowsGroup></WindowsGroup>
  </div>
</template>
  
  <script lang="ts" setup>

import { onMounted } from 'vue';

import TaskBar from './window/structure/TaskBar.vue';
import ContextMenu from './window/structure/ContextMenu.vue';
import Desktop from './window/structure/Desktop.vue';

import Bluescen from './window/structure/Bluescen.vue';
import WindowsGroup from './window/structure/WindowsGroup.vue';

import { computerCTC } from './window/libs/systemStates';

onMounted(() => {
  computerCTC.getInstance().openPower()
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
  
