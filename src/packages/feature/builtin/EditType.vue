<template>
    <div class="outer">
        <input class="win-input" v-model="type">
        <WinButton @click="confirm">确定</WinButton>
    </div>
</template>
<script setup lang="ts">
import WinButton from '@/packages/components/WinButton.vue';
import { inject, ref } from 'vue';
import { VtronFile } from '../core/FileSystem';
import { useSystem } from '../system';
import { BrowserWindow } from '../window/BrowserWindow';

let browserWindow:BrowserWindow = inject('browserWindow')!
let type = ref((browserWindow.config.content as VtronFile).type);

function confirm(){
    useSystem()?.fs.writeFile(browserWindow.config.content.path, {
        ...browserWindow.config.content,
        type: type.value
    }).then(() => {
        browserWindow.close();
    })
}
</script>
<style lang="scss" scoped>
.outer{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    .win-input{
        font-size: 20px;
        width: 200px;
        height: 40px;
        margin-bottom: 40px;
        outline: none;
        border: 1px solid black;
        &:focus{
            border: 1px solid var(--color-blue);
        }
    }

}
</style>