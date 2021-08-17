<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-17 14:48:35
 * @Description: 
 * @FilePath: /myindex/src/components/win.vue
-->
<template>
  <div class="win_outer" id="winid">
    <TaskBarVue></TaskBarVue>
    <MenuListVue></MenuListVue>
    <DesktopVue></DesktopVue>
    <BluescenVue></BluescenVue>
    <!-- <WindowsGroupVue></WindowsGroupVue> -->
  </div>
</template>
  
  <script lang="ts" setup>

import { onMounted } from '@vue/runtime-core';

import TaskBarVue from './window/TaskBar.vue';
import MenuListVue from './window/MenuList.vue';
import DesktopVue from './window/Desktop.vue';

import BluescenVue from './window/bluescen.vue';

import { computerCTC } from './window/libs/computerCTC';
// import WindowsGroupVue from './window/WindowsGroup.vue';


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
  
