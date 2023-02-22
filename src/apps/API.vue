<template>
<div>
  width:{{win.windowInfo.width}}
  height:{{win.windowInfo.height}}
  x:{{win.windowInfo.x}}
  y:{{win.windowInfo.y}}
</div>
  <div class="button-group">
    <WinBotton v-for="item in functionArray" @click="item.call">{{ item.name }}</WinBotton>
  </div>
</template>
<script lang="ts" setup>
import InfoVue from "./TestButton.vue";
import { system } from "../systeminit";
// import { WinCheckBox } from "../packages/plugages/plug";
import { WinBotton } from "../packages/plugages/plug";


let win = system.DragWindow({
        width: 200,
        height: 100,
        content: InfoVue
      })
let functionArray = [
  {
    name: "弹出提示",
    call: () => {
      system.Notify.notify('弹出提示', '这是一个提示')
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
.button-group{
  display: flex;
  flex-direction: column;
}
</style>