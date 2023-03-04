<template>
    <template v-if="typeof content==='string'">
        test
        <iframe :src="content" frameborder="0" width="100%" height="100%"></iframe>
    </template>
    <template v-else>
        <component :is="content"></component>
    </template>
</template>
<script setup lang="ts">
import {  UnwrapNestedRefs } from "vue";
import { BrowserWindow } from "../BrowserWindow";
let props = defineProps<{
    content: UnwrapNestedRefs<BrowserWindow['content']|string>
}>()
console.log(props.content)
</script>