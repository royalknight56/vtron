<template>
    <div class="appicon">
        <img :src="windowNode.windowInfo.icon" />
    </div>
</template>
<script lang="ts" setup>
import { UnwrapNestedRefs } from 'vue';
import { BrowserWindow } from '../../window/BrowserWindow';
defineProps<{
    windowNode:UnwrapNestedRefs<BrowserWindow>;
}>()
</script>
<style lang="scss" scoped>
.appicon{
    width: var(--bar-height);
    height: var(--bar-height);
    background-color: #2de520;
    display: flex;
    justify-content: center;
    align-items: center;
    img{
        width: 80%;
        height: 80%;
    }
}
</style>