<template>
背景URL：<input v-model='backURL'>
<button @click="saveBack">✅</button>
启动时间：<input v-model='startTime'>
<button @click="saveStartTime">✅</button>

<button @click="clear">清空</button>

</template>
<script lang="ts" setup>
import { ref } from 'vue';
import {storeConfig,setConfig,clearStoreConfig,appconfig} from '../../../appconfig'
let backURL = ref(appconfig.backimg)
let startTime = ref(appconfig.start_time)
function saveBack(){
    setConfig('backimg',backURL.value)
    storeConfig()
}
function saveStartTime(){
    setConfig('start_time',startTime.value)
    storeConfig()

}
function clear(){
    clearStoreConfig()
}
</script>