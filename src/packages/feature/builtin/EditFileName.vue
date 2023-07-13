<template>
    <div class="outer">
        <input class="win-input" v-model="name">
        <WinButton @click="confirm">{{ i18n('confirm') }}</WinButton>
    </div>
</template>
<script setup lang="ts">
import WinButton from '@/packages/components/WinButton.vue';
import { inject, ref } from 'vue';
import { VtronFile } from '@/packages/feature/core/fileSystem';
import { useSystem } from '../system';
import { BrowserWindow } from '../window/BrowserWindow';
import { emitEvent } from '../event';
import { join } from '../core/Path';
import { basename } from "@/packages/feature/core/Path"
import { Notify } from '../notification/Notification';
import { i18n } from '@/packages/feature/i18n';

let browserWindow: BrowserWindow = inject('browserWindow')!
let name = ref(basename((browserWindow.config.content as VtronFile).path));

function confirm() {
    if (name.value.length > 40) {
        new Notify({
            title: '提示',
            content: '文件名过长',
        })
        return
    }
    let newPath = join(browserWindow.config.content.path, '..', name.value)
    useSystem()?.fs.rename(browserWindow.config.content.path, newPath).then(() => {
        emitEvent('file.props.edit')
        browserWindow.emit('file.props.edit', newPath)
        browserWindow.close();
    })
}
</script>
<style lang="scss" scoped>
.outer {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;

    .win-input {
        font-size: 20px;
        width: 200px;
        height: 40px;
        margin-bottom: 40px;
        outline: none;
        border: 1px solid black;

        &:focus {
            border: 1px solid var(--color-blue);
        }
    }

}
</style>