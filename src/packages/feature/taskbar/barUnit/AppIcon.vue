<template>
    <div class="appicon" @contextmenu.prevent="handleRightClick">
        <img :src="windowNode.windowInfo.icon" />
    </div>
</template>
<script lang="ts" setup>
import { UnwrapNestedRefs } from 'vue';
import { emitEvent } from '../../event';
import { BrowserWindow } from '../../window/BrowserWindow';
let props = defineProps<{
    windowNode:UnwrapNestedRefs<BrowserWindow>;
}>();
function handleRightClick(){
    emitEvent('contextMenu.show', {
        x: 0,
        y: 0,
        windowNode: props.windowNode
    });
}
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