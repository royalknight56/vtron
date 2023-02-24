<template>
    <div class="desk-group">
        <div class="desk-item" v-for="item in appList" :key="item.name">

        </div>
    </div>

</template>
<script lang="ts" setup>
import { useRootState } from '../state/Root';
let rootState = useRootState();
let appList = rootState.system.apps;
</script>
<style lang="scss" scoped>
.desk-group {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    height: 100%;

    .desk-item {
        width: 100px;
        height: 100px;
        background-color: #e58220;
    }
}
</style>