<template>
    <div class="viewer">
        <iframe class="viewer-img" :src="window?.config.content"></iframe>
    </div>
</template>
<script setup lang="ts">
import { BrowserWindow } from 'vtron';
import { inject } from 'vue';

let window:BrowserWindow|undefined = inject('browserWindow');

</script>
<style scoped>
.viewer{
    width: 100%;
    height: 100%;
    background-color: #000;
}
.viewer-img{
    width: 100%;
    height: 100%;
    object-fit: contain;
}
</style>