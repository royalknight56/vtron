<template>
    <div class="outer">
        <div class="tab">
            <div class="tab-item">
                {{ i18n('general') }}
            </div>
        </div>
        <div class="content">
            <div class="propitem">
                <div class="propname">
                    <div class="file-icon">
                        <FileIcon :file="file" />
                    </div>
                </div>
                <div class="propvalue">{{ basename(file?.path || '') }}
                    <WinButton class="some-button" @click="editFileName">
                        {{ i18n('rename') }}
                    </WinButton>
                </div>
            </div>
            <div class="split-line"></div>
            <div class="propitem">
                <div class="propname">
                    {{ i18n('file.type') }}：
                </div>
                <div class="propvalue">{{ extname(file?.path || "") }}
                </div>
            </div>
            <div class="propitem">
                <div class="propname">
                    {{ i18n('location') }}：
                </div>
                <div class="propvalue">{{ file?.path }}</div>
            </div>
        </div>
        <div class="button-group">
            <WinButton @click="confirm">
                {{ i18n('confirm') }}
            </WinButton>
            <WinButton @click="confirm">
                {{ i18n('cancel') }}
            </WinButton>
        </div>
    </div>
</template>
<script setup lang="ts">
import WinButton from '@/packages/components/WinButton.vue';
import { inject, ref } from 'vue';
import { useSystem } from '../system';
import { BrowserWindow } from '../window/BrowserWindow';
import EditType from "./EditType.vue"
import EditFileName from "./EditFileName.vue"

import foldericon from "@/packages/assets/folder.ico";
import unknownicon from "@/packages/assets/unknown.ico";
import FileIcon from "@/packages/feature/builtin/FileIcon.vue";
import { mountEvent } from '../event';
import { VtronFile } from '@/packages/plug';
import { basename, extname } from "@/packages/feature/core/Path"
import { i18n } from '@/packages/feature/i18n';

let window: BrowserWindow | undefined = inject('browserWindow');
const file = ref<VtronFile | null>();
file.value = await useSystem()?.fs.stat(window?.config.content);

// mountEvent('file.props.edit', async (source: string, data: any) => {
//     file.value = await useSystem()?.fs.stat(window?.config.content);
// });

function confirm() {
    window?.close();
}
function editType() {
    let win = new BrowserWindow({
        // title: '修改类型',
        title: i18n('edit.type'),
        content: EditType,
        config: {
            content: file
        },
        width: 300,
        height: 200,
        center: true,
        resizable: false,
    })
    win.on('closed', async () => {
        file.value = await useSystem()?.fs.stat(window?.config.content);
    })
    win.show();
}

function editFileName() {
    let win = new BrowserWindow({
        title: i18n('rename'),
        content: EditFileName,
        config: {
            content: file
        },
        width: 300,
        height: 200,
        center: true,
        resizable: false,
    })
    win.on('file.props.edit', async (source: string, data: any) => {
        file.value = await useSystem()?.fs.stat(data);
    })
    // win.on('closed', async () => {
    //     file.value = await useSystem()?.fs.stat(window?.config.content);
    // })
    win.show();
}

</script>
<style lang="scss" scoped>
.outer {
    display: flex;
    flex-direction: column;
    background-color: var(--color-ui-gray);
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
    font-size: var(--ui-font-size);

    .tab {
        display: flex;
        flex-direction: row;
        height: var(--ui-list-item-height);
        transform: translateY(1px);

        .tab-item {
            width: 50px;
            text-align: center;
            padding-top: 2px;
            border: var(--light-border);
            border-bottom: none;
            background-color: #fff;
        }
    }

    .content {
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        background-color: #fff;
        border: var(--light-border);

        .split-line {
            height: 1px;
            width: calc(100% - 30px);
            background-color: #252525;
            margin: 6px;
        }

        .propitem {
            display: flex;
            flex-direction: row;
            justify-content: center;
            padding: 4px;
            width: 100%;

            .propname {
                width: 80px;
                margin-left: 20px;

            }

            .file-icon {
                width: calc(var(--ui-list-item-height)*2);
                height: calc(var(--ui-list-item-height)*2);
            }

            .propvalue {
                flex: 1;
                display: flex;
                align-items: center;
                // justify-content: space-between;
            }
        }
    }

    .button-group {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        margin-top: 10px;
        gap: 10px;
    }

    .some-button {
        margin-left: 10px;
    }

}
</style>