<template>
背景URL：<input v-model='backURL'>
<button @click="saveBack">✅</button>
启动时间：<input v-model='startTime'>
<button @click="saveStartTime">✅</button>

<button @click="clear">清空</button>

</template>
<script lang="ts" setup>
import { ref } from '@vue/reactivity';
import {storeConfig,clearStoreConfig,appconfig} from '../../../appconfig'
let backURL = ref(appconfig.backimg)
let startTime = ref(appconfig.start_time)
function saveBack(){
    storeConfig('backimg',backURL.value)
}
function saveStartTime(){
    storeConfig('start_time',startTime.value)
}
function clear(){
    clearStoreConfig()
}
</script>