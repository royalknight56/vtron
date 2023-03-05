<template>
    <template v-if="typeof window.content==='string'">
        <iframe :src="window.content" frameborder="0" width="100%" height="100%"></iframe>
    </template>
    <template v-else>
        <Suspense>
            <component :is="window.content" :window="window"></component>
        </Suspense>
    </template>
</template>
<script setup lang="ts">
import {  UnwrapNestedRefs } from "vue";
import { BrowserWindow } from "../BrowserWindow";
let props = defineProps<{
    window: UnwrapNestedRefs<BrowserWindow>
}>()
</script>