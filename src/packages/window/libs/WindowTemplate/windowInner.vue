<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-15 11:10:34
 * @Description: 
-->
<template>
  <template v-if="loadState == 'loading'">
    <LoaddingVue></LoaddingVue>
  </template>
  <template v-else-if="loadState == 'error'">
    <ErrorVue></ErrorVue>
  </template>
  <template v-else-if="loadState == 'success'">
    <!-- <ErrorVue></ErrorVue> -->
  </template>
  <template v-if="componentType == 'url'">
    <iframe ref="iframeref" :src="compileCom"></iframe>
  </template>

  <template v-else-if="componentType == 'sfc'">
    <component :is="compileCom" :key="componentKey"></component>
  </template>
  <template v-else>
    <component :is="compileCom" :key="componentKey"></component>
  </template>
</template>
<script lang="ts" setup>
import { defineAsyncComponent, defineComponent, inject, nextTick, onMounted, ref, shallowRef, toRaw } from 'vue';
import { Ref, PropType } from 'vue'
import LoaddingVue from '@libs/WindowTemplate/defaultInner/loadding.vue';
import ErrorVue from '@libs/WindowTemplate/defaultInner/error.vue';
import { System } from '@libs/System'
// import { nextTick } from 'process';
let props = defineProps({
  componentKey: {
    type: Number as PropType<Number>,
    required: true
  },
  id: {
    type: String,
    required: true
  }
})

let system = <System>inject('system')

let winID = props.id;
let wininfo = system.getWindow(winID)?.windowInfo;
let componentType = ref('url');
const loadState = ref('loading');

let compileCom = shallowRef({}) as any;

let iframeref = ref()

onMounted(() => {
  if(!wininfo){
    return
  }
  if (typeof wininfo.content === 'object') {
    componentType.value = 'vue'
    compileCom.value = toRaw(wininfo.content)
    loadState.value = 'success'
  } else {
    componentType.value = 'url'
    compileCom.value = toRaw(wininfo.content);
    nextTick(() => {
      iframeref.value.onload =function(){
        loadState.value = 'success'
        iframeref.value?.contentWindow.postMessage({ action: 'init',  id: winID }, '*')
      }
    })
  }

})

</script>