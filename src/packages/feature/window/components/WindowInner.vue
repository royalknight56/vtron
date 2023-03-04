<template>
    <template v-if="typeof content==='string'">
        test
        <iframe :src="content" frameborder="0" width="100%" height="100%"></iframe>
    </template>
    <template v-else>
        <Suspense>
            <component :is="content.content" :window="content"></component>
        </Suspense>
    </template>
</template>
<script setup lang="ts">
import {  UnwrapNestedRefs } from "vue";
import { BrowserWindow } from "../BrowserWindow";
let props = defineProps<{
    content: UnwrapNestedRefs<BrowserWindow|string>
}>()
</script>