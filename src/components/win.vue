<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-09 15:13:31
 * @Description: 
 * @FilePath: /myindex/src/components/win.vue
-->
<template>
  <div class="win_outer" id="winid">
    <TaskBarVue></TaskBarVue>
    <MenuListVue></MenuListVue>
    <DesktopVue></DesktopVue>
    <BluescenVue></BluescenVue>
  </div>
</template>
  
  <script lang="ts" setup>

import { ref } from '@vue/reactivity';
import { onMounted } from '@vue/runtime-core';
import { DragWindow } from './window/libs/DragWindow'

import TaskBarVue from './window/TaskBar.vue';
import MenuListVue from './window/MenuList.vue';
import DesktopVue from './window/Desktop.vue';

import Help from './window/apps/Help.vue';
import BluescenVue from './window/bluescen.vue';
import { computerCTC } from './window/libs/computerCTC';


onMounted(() => {
  // new DragWindow(100, 100, '关于', 200, 100, Help)
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
  
