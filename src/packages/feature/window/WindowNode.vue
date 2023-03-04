<template>
    <Transition name="window-animate">
        <WindowTemplate v-if="windowNode.value.windowInfo.isCreated" :browserWindow="windowNode.value"></WindowTemplate>
    </Transition>
    <WindowNode v-for="node in windowNode.children" :key="node.value?.id" :windowNode="node" />
</template>
<script lang="ts" setup>
import { Tree } from '@/packages/util/Tree';
import { BrowserWindow } from '@packages/feature/window/BrowserWindow';
import { UnwrapNestedRefs, watch } from 'vue';
import WindowNode from './WindowNode.vue';
import WindowTemplate from './WindowTemplate.vue';

let props = defineProps<{
    windowNode: UnwrapNestedRefs<Tree<BrowserWindow>>
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