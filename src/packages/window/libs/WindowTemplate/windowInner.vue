<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:08:03
 * @Description: 
-->
<template>
    <template v-if="componentType=='loadding'">
      <LoaddingVue></LoaddingVue>
    </template>
    <template v-else-if="componentType=='error'">
      <ErrorVue></ErrorVue>
    </template>
    <template v-else-if="componentType=='url'">
      <iframe :src="compileCom"></iframe>
    </template>
    
    <template v-else-if="componentType=='sfc'">
      <component :is="compileCom" :key="componentKey"></component>
    </template>
    <template v-else>
      <component :is="compileCom" :key="componentKey"></component>
    </template>
</template>
<script lang="ts" setup>
import { defineAsyncComponent, defineComponent, inject, onMounted, ref, shallowRef, toRaw } from 'vue';
import  {Ref,PropType} from 'vue'
import {fetchComponent} from "@libs/WindowTemplate/getCom";
import { DWM, PrivateDWM } from "@/packages/window/libs/DWM/index";
import LoaddingVue from '@libs/WindowTemplate/defaultInner/loadding.vue';
import ErrorVue from '@libs/WindowTemplate/defaultInner/error.vue';
import {System} from '@libs/System'
let props = defineProps({
  componentKey:{
    type:Number as PropType<Number>,
    required:true
  },
  id:{
    type:String,
    required:true
  }
})

let system = <System>inject('system')

let winID = props.id;
let wininfo = system.DWM.privateDWM.getWindow(winID);
let componentType = ref('loadding')
let compileCom = shallowRef({}) as any;

onMounted(()=>{
  
  if(wininfo.isSFC){
    fetchComponent(wininfo.content).then(res=>{
      compileCom.value = res
      componentType.value ='sfc'
    }).catch(err=>{
      componentType.value ='error'
      console.log(err)
    })
  }else if(typeof wininfo.content === 'object') {
    componentType.value= 'vue'
    compileCom.value = toRaw(wininfo.content)
  }else{
    componentType.value = 'url'
    compileCom.value =toRaw(wininfo.content)
  }
})

</script>