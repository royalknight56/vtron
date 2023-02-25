<template>
    <div class="window-node">
        <div class="window-self">
            <WindowTemplate :browserWindow="windowNode.value"></WindowTemplate>
        </div>
        <div class="window-children">
            <WindowNode v-for="node in windowNode.children" :key="node.value?.id" :windowNode="node" />
        </div>
    </div>
</template>
<script lang="ts" setup>
import { Tree } from '@/packages/util/Tree';
import { BrowserWindow } from '@packages/feature/window/BrowserWindow';
import { UnwrapNestedRefs } from 'vue';
import WindowNode from './WindowNode.vue';
import WindowTemplate from './WindowTemplate.vue';

defineProps<{
    windowNode: UnwrapNestedRefs<Tree<BrowserWindow>>
}>()
</script>
<style lang="scss" scoped>

</style>