<template>
    <div class="icon">
        <template v-if="file">
            <img v-if="file.isDirectory" draggable="false" :src="foldericon" />
            <img v-else-if="extname(file.path) === '.exe'" draggable="false" :src="dealIcon(file)" />
            <img v-else-if="extname(file.path) === '.png'" draggable="false" :src="file.content" />
            <img v-else draggable="false" :src="unknownicon" />
        </template>
        <template v-else-if="icon">
            <img draggable="false" :src="icon" />
        </template>
        <template v-else>
            <img draggable="false" :src="foldericon" />
        </template>

    </div>
</template>
<script setup lang="ts">
import { defineProps } from "vue";
import foldericon from "@/packages/assets/folder.ico";
import unknownicon from "@/packages/assets/unknown.ico";
import { VtronFile } from "../core/fileSystem";
import { extname } from "../core/Path";

const props = defineProps<{
    file?: VtronFile | null,
    icon?: string
}>();
function dealIcon(file: VtronFile) {
    let exeContent = file.content.split(':');
    let iconImg = exeContent.slice(4).join(':')
    if (iconImg != 'undefined' && iconImg != '' && iconImg != null && iconImg) {
        return iconImg;
    } else {
        return unknownicon;
    }

}
//
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