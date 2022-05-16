<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-05-15 19:01:10
 * @Description: 
-->
<template>
  <template v-if="component?.isUrl">
    <iframe :src="component.url"></iframe>
  </template>
  <template v-else>
    <component :is="component" :key="componentKey"></component>
  </template>

</template>
<script lang="ts" setup>
import { defineAsyncComponent, defineComponent, onMounted, ref, toRaw } from 'vue';
let props = defineProps([
  'component',
  'componentKey',
  'isUrl'
])
// let isUrl = ref(false)

// onMounted(() => {
//   console.log(props)
// })
// if (props.component instanceof String) {
//   isUrl.value = true;
// }
// console.log(isUrl)
</script>