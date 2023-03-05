<template>
    <Transition name="window-animate">
        <WindowTemplate v-if="window.windowInfo.isCreated" :browserWindow="window"></WindowTemplate>
    </Transition>
    <WindowNode v-for="node in window.children" :key="node.id" :window="node" />
</template>
<script lang="ts" setup>
import { Tree } from '@/packages/util/Tree';
import { BrowserWindow } from '@packages/feature/window/BrowserWindow';
import { UnwrapNestedRefs, watch } from 'vue';
import WindowNode from './WindowNode.vue';
import WindowTemplate from './WindowTemplate.vue';

let props = defineProps<{
    window: UnwrapNestedRefs<BrowserWindow>
}>();

</script>
<style lang="scss" scoped>
.window-animate-enter-active,
.window-animate-leave-active {
    transition: all 0.1s ease;
}

.window-animate-enter-from,
.window-animate-leave-to {
    opacity: 0;
}
</style>