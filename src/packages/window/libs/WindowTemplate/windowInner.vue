<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-06-24 15:20:54
 * @Description: 
-->
<template>
<template v-if="!loadding">
  <template v-if="componentType=='url'">
      <iframe :src="compileCom"></iframe>
    </template>
    <template v-else-if="componentType=='sfc'">
      <component :is="compileCom" :key="componentKey"></component>
    </template>
    <template v-else>
      <component :is="compileCom" :key="componentKey"></component>
    </template>
  </template>
</template>
<script lang="ts" setup>
import { defineAsyncComponent, defineComponent, onMounted, ref, shallowRef, toRaw } from 'vue';
import {fetchComponent} from "@libs/WindowTemplate/getCom";
import { DWM, PrivateDWM } from "@/packages/window/libs/DWM/index";
let props = defineProps([
  'componentKey',
  'id',
])
let winID = props.id;
let wininfo = PrivateDWM.getInstance().getWindow(winID);
let componentType = ref('')
// let compileCom = shallowRef({}) as any;
let loadding = ref(true)
let compileCom = shallowRef({}) as any;

onMounted(()=>{
  
  if(wininfo.isVue){
    componentType.value ='sfc'
    fetchComponent(wininfo.content).then(res=>{
      compileCom.value = res
      loadding.value = false
    })
  }else if(typeof wininfo.content === 'object') {
    componentType.value= 'vue'
    compileCom.value = toRaw(wininfo.content)
    loadding.value = false

  }else{
    
    componentType.value = 'url'
    compileCom.value =toRaw(wininfo.content)
    loadding.value = false
  }
})

</script>