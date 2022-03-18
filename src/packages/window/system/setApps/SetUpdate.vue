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
        <button @click="saveBack();saveStartTime()">保存配置</button>

        <button @click="clear">清空本地配置</button>
    </div>
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
.set_left{
    width: 20%;
    height: 100%;
    position: absolute;
    left: 0%;
    background-color: rgba(75, 75, 75, 0.445);
}
.set_dash{
    display:flex;
    flex-direction:column;
    width:80%;
    height:100%;
    position: absolute;
    left:20%;
    padding: 30px;
    // background-color: blanchedalmond;
}
.set_item{
    font-weight: 300;
    padding: 6px 10px;
    input{
        border: 1px solid #555;
        padding: 4px 6px;
        background-color: rgb(221, 221, 221);
        transition: all 0.1s;
    }
    input:focus{
        background-color: rgb(255, 255, 255);
    }
    button{
        cursor: pointer;
        vertical-align: bottom;
        height: 20px;
        // width: 50px;
        margin: 0 4px;
        padding: 10px 20px;
        border:none;
        background-color: rgba(85, 85, 85, 0.37);
        transition: all 0.1s;
    }
    button:hover{
        background-color: rgba(85, 85, 85, 0.5);
    }
}
</style>