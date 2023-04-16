<template>
    <div class="icon">
        <img v-if="icon === 'dir'" draggable="false" :src="foldericon" />
        <img v-else-if="icon === 'file'" draggable="false" :src="unknownicon" />
        <img v-else-if="icon" draggable="false" :src="icon" />
        <img v-else draggable="false" :src="unknownicon" />
    </div>
</template>
<script setup lang="ts">
import { defineProps } from "vue";
import foldericon from "@/packages/assets/folder.ico";
import unknownicon from "@/packages/assets/unknown.ico";
const props = defineProps<{
    icon: string;
}>();
</script>
<style lang="scss" scoped>
.icon {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
}
</style>