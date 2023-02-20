<template>
    <div class="set_left">
    </div>
    <div class="set_dash">
        <div class="set_item">
            背景URL：
            <input v-model="backURL" />
        </div>
        <div class="set_item">
            启动时间：
            <input v-model="startTime" />
        </div>
        <div class="set_item">
            <button @click="saveBack(); saveStartTime()">保存配置</button>
            <button @click="clear">清空本地配置</button>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, inject } from 'vue';

import { System } from '@libs/System'
let system = <System>inject('system');
const appconfig = system.SystemConfig.config

let backURL = ref(appconfig.backimg)
let startTime = ref(appconfig.start_time)

function saveBack() {
    system.SystemConfig.setConfig('backimg', backURL.value)
}
function saveStartTime() {
    system.SystemConfig.setConfig('start_time', startTime.value)
}
function clear() {
    // clearStoreConfig()
}
</script>
<style lang="scss" scoped>
@import "@/packages/main.css";
@import "./setStyle.scss";
</style>