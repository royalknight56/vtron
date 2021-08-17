<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-17 14:36:33
 * @Description: 
 * @FilePath: /myindex/src/apps/askDialog.vue
-->
<template>
确定？
<button  @click="close('确定')">确定</button>
  <button @click="close('取消')">取消</button>
</template>
<script lang="ts" setup>
import type { PropType } from "@vue/runtime-core";
import { WindowIPC } from "../components/window/libs/WindowIPC";
import type { PageItem } from "../components/window/libs/WindowIPC"


let props = defineProps({
  ctx:{
    type:Object as PropType<PageItem>
  }
})

function close(str:string) {
  WindowIPC.getInstance().emit('testEvent',str)
  if(props.ctx?.id){
    WindowIPC.getInstance().destoryWindow(props.ctx?.id)
  }
}

</script>