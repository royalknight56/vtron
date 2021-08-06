<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-06 09:31:46
 * @Description: 
 * @FilePath: /myindex/src/App.vue
-->
<template>
  <div>
    <TaskBarVue></TaskBarVue>
    <MenuListVue></MenuListVue>
    <DesktopVue></DesktopVue>
    <bluescenVue></bluescenVue>
  </div>
</template>

<script lang="ts" setup>

import { ref } from '@vue/reactivity';
import { onMounted } from '@vue/runtime-core';
import {DragWindow} from './components/window/libs/DragWindow'
import bluescenVue$1 from './components/states/bluescen.vue';

import TaskBarVue from './components/window/TaskBar.vue';
import MenuListVue from './components/window/MenuList.vue';
import DesktopVue from './components/window/Desktop.vue';
import Test1 from "./components/window/apps/Test1.vue"
import Help from './components/window/apps/Help.vue';
import bluescenVue from './components/states/bluescen.vue';
import { computerCTC } from './components/computerCTC';



let test1 = ref(null)
let test2 = ref(null)
let test3 = ref(null)

onMounted(() => {
  new DragWindow(100,100,'帮助',200,200,Help)

  computerCTC.getInstance().openPower()
  // console.log(test1.value)
  // let a = new DragElement(0, 0, <HTMLElement><any>test1.value);
  // let b = new DragElement(0, 0, <HTMLElement><any>test2.value);

  // let x1 = 0;
  // let y1 = 0;
  // let x2 = 0;
  // let y2 = 0;

  // a.onDrag((x: number, y: number) => {
  //   // console.log(x, y);
  //   x1 = x;
  //   y1 = y;
  //   change3cube(parseInt((<any>test1.value as HTMLElement).style.left), parseInt((<any>test1.value as HTMLElement).style.top),parseInt((<any>test2.value as HTMLElement).style.left), parseInt((<any>test2.value as HTMLElement).style.top))
  //   // change3cube(x1, y1, x2, y2);
  // })
  // b.onDrag((x: number, y: number) => {
  //   // console.log(x, y)
  //   x2 = x;
  //   y2 = y;
  //   change3cube(parseInt((<any>test1.value as HTMLElement).style.left), parseInt((<any>test1.value as HTMLElement).style.top),parseInt((<any>test2.value as HTMLElement).style.left), parseInt((<any>test2.value as HTMLElement).style.top))

  //   // change3cube(x1, y1, x2, y2);
  // })

  // function change3cube(x: number, y: number, x2: number, y2: number): void {
  //   (<unknown>test3.value as HTMLElement).style.left = (x < x2 ? x : x2) + 'px';
  //   (<unknown>test3.value as HTMLElement).style.top = (y < y2 ? y : y2) + 'px';
  //   (<unknown>test3.value as HTMLElement).style.width = Math.abs(x2 - x) + 'px';
  //   (<unknown>test3.value as HTMLElement).style.height = Math.abs(y2 - y) + 'px';
  // }
})

</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center; */
  /* color: #2c3e50; */
  /* margin-top: 60px; */
}
body{
  padding: 0;
  margin: 0;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  background-color: rgb(8, 130, 190);
}
.dragobj {
  cursor: all-scroll;
  position: absolute;
  user-select: none;
  width: 100px;
  height: 100px;
  background-color: #2c3e50;
  /* transition: all 2s; */
}
.cube3 {
  z-index: -1;
  background-color: antiquewhite;
  position: absolute;
  user-select: none;
  width: 100px;
  height: 100px;
  /* transition: all 0.2s; */
}
</style>
