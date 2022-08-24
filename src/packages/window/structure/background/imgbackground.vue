<!--
 * @Author: Royal
 * @LastEditTime: 2022-05-29 15:46:11
 * @Description: 
-->
<template>
<div class="outer">
 <div class="backimg">
    <img ondragstart="return false;" draggable="false" onerror="this.src=''" :src="appconfig.backimg">
  </div>
</div>

</template>
<script lang="ts" setup>
import { inject } from 'vue';
import {System} from '@libs/System'

let system =<System>inject('system');
const appconfig = system.SystemConfig.config

</script>
<style scoped>
@import '../../../main.css';

img[src=""],img:not([src]) {
    display: none;
}
.outer{
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    /* z-index: -50; */
    background-color: rgb(0, 119, 210);
    user-select: none;
}
.backimg{
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    user-select: none;
    -moz-user-select: none;
}
.backimg img{
    width: 100%;
    height: 100%;
    object-fit: cover;
    user-select: none;
    -moz-user-select: none;
}
</style>