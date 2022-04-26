<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-04-26 15:40:39
 * @Description: 
-->
<template>
<div class="alert_group">
    <template v-for="item in BIS.getInstance().NotificationMap" :key="item">
    <div class="alert" :class="{isHidden:item.isHidden}">
        <div class="alert_title">
            {{item.title}}
        </div>
        <div class="alert_message">
            {{item.messages}}
        </div>
    </div>
    </template>
    
</div>
    
</template>
<script setup lang="ts">
import { BIS } from "@libs/BuildInState";
</script>
<style scoped>
@import '../../main.css';
.alert_group{
    display: flex;
    flex-direction: column;
    height: min-content;
    position: absolute;
    right: 10px;
    bottom: 40px;
    color: aliceblue;
}
.alert {
    position: relative;
    
    width: 240px;
    height: 100px;
    margin: 10px;
    background: #232323;
    display: flex;
    flex-direction: column;
    animation:alertAnimate forwards 0.4s cubic-bezier(0, 0.49, 0, 0.9);
    user-select: none;
    
}
.isHidden{
    animation:alertHidAnimate forwards 0.4s cubic-bezier(0, 0.49, 0, 0.9);
    
}
@keyframes alertAnimate {
    0% {
        transform: translateX(100%);
    }
    100% {
        transform: translateX(0%);
    }
}
@keyframes alertHidAnimate {
    0% {
        transform: translateX(0%);
    }
    100% {
        transform: translateX(120%);
    }
}
.alert_title{
    padding:24px 0 5px 20px;
    font-size: 20px;
    font-weight: bold;
}
.alert_message{
    padding: 4px 20px;
    font-size: 16px;
    color: rgba(240, 248, 255, 0.637);
}
</style>