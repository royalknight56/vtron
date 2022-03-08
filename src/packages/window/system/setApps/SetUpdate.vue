<template>
    <div class="set_item">
        背景URL：
        <input v-model="backURL" />
        <button @click="saveBack">✅</button>
    </div>
    <div class="set_item">
        启动时间：
        <input v-model="startTime" />
        <button @click="saveStartTime">✅</button>
    </div>
    <div class="set_item">
        <button @click="clear">清空本地配置</button>
    </div>

    
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { storeConfig, setConfig, clearStoreConfig, appconfig } from '../../../appconfig'
let backURL = ref(appconfig.backimg)
let startTime = ref(appconfig.start_time)
function saveBack() {
    setConfig('backimg', backURL.value)
    storeConfig()
}
function saveStartTime() {
    setConfig('start_time', startTime.value)
    storeConfig()

}
function clear() {
    clearStoreConfig()
}
</script>
<style lang="scss" scoped>
@import "../../../main.css";
.set_item{
    font-weight: 300;
    padding: 6px 10px;
    input{
        border: 1px solid #555;
        padding: 4px 6px;
    }
    button{
        vertical-align: bottom;
        height: 20px;
        // width: 50px;
        margin: 0 4px;
        padding: 1px 20px;
    }
}
</style>