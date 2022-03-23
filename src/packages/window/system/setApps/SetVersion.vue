<template>
<div class="set_left">

</div>
<div class="set_dash">
    <div class="set_item">
        版本更新
        ：{{version}}
    </div>
    <div class="set_item">
        <button>检查更新</button>

    </div>
</div>
    

    
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { storeConfig, setConfig, clearStoreConfig, appconfig } from '../../../appconfig'
let version = ref('1.0.0')
</script>
<style lang="scss" scoped>
@import "../../../main.css";
@import "./setStyle.scss";
</style>