<template>
    <div class="outer">
        <button @click="openLrc">
            Open
        </button>
    </div>
</template>
<script setup lang="ts">
import { BrowserWindow } from 'vtron';
import Lrc from "../Lrc.vue"
let lrc = new BrowserWindow({
    title: '歌词',
    width: 300,
    height: 100,
    x: 0,
    y: 0,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    content:Lrc,
    minimizable: false,
    backgroundColor: '#00000030',
    skipTaskbar: true,
})

function openLrc() {
    lrc.show()
}


</script>