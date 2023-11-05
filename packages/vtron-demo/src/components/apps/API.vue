<template>
<div>
  width:{{win.windowInfo.width}}
  height:{{win.windowInfo.height}}
  x:{{win.windowInfo.x}}
  y:{{win.windowInfo.y}}

</div>
  <div v-for="item in functionArray">
    <button @click="item.call">{{ item.name }}</button>
  </div>
</template>
<script lang="ts" setup>
import { BrowserWindow } from "vtron";
import InfoVue from "./Info.vue";

let win = new BrowserWindow({
        width: 200,
        height: 100,
        content: InfoVue
      })
let functionArray = [
  {
    name: "弹出提示",
    call: () => {
      // system.Notify.notify('弹出提示', '这是一个提示')
    }
  },
  {
    name: "弹出新窗口",
    call: () => {
      win.show()
    }
  },
  {
    name:'关闭窗口',
    call:()=>{
      win.destroy()
    }
  },
  {
    name:'最大化窗口',
    call:()=>{
      win.maximize()
    }
  },
  {
    name:'最小化窗口',
    call:()=>{
      win.minimize()
    }
  }
]
</script>
<style scoped>
</style>