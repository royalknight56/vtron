<template>
    <div class="state-group">
        <div class="state-item battery">
            <Battery></Battery>
        </div>
        <div class="state-item network">
            <NetWork></NetWork>
        </div>
        <div class="showdesk">
            
        </div>
    </div>
</template>
<script setup lang="ts">
import Battery from './Battery.vue';
import NetWork from './NetWork.vue';
</script>
<style lang="scss" scoped>
.state-group {
    display: flex;
    align-items: center;
    user-select: none;
    .state-item{
        padding: 0 8px;
        height: 100%;
        display: flex;
        align-items: center;
    }
    .state-item:hover{
        background-color: rgba(255, 255, 255, 0.519);
    }
}
.showdesk{
    width: 6px;
    height: 100%;
    border-left: 1px solid rgba(0, 0, 0, 0.222);
}
</style>