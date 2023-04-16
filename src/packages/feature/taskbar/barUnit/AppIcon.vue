<template>
    <div class="appicon" @contextmenu.prevent="handleRightClick" @click="handleClick">
        <div class="appicon-img">
            <FileIcon :icon="windowNode.windowInfo.icon" />
        </div>
    </div>
</template>
<script lang="ts" setup>
import { UnwrapNestedRefs } from 'vue';
import { emitEvent } from '../../event';
import { BrowserWindow } from '../../window/BrowserWindow';
import FileIcon from "@/packages/feature/builtin/FileIcon.vue";

let props = defineProps<{
    windowNode:UnwrapNestedRefs<BrowserWindow>;
}>();
function handleRightClick(e:MouseEvent){
    emitEvent('contextMenu.show', {
        x: 0,
        y: 0,
        mouse: e,
        menuList: [
            {
                name: '关闭',
                click: () => {
                    props.windowNode.close();
                }
            },
            {
                name: '最小化',
                click: () => {
                    props.windowNode.minimize();
                }
            },
            {
                name: '最大化',
                click: () => {
                    props.windowNode.maximize();
                }
            }
        ]
    });
}
function handleClick(){
    props.windowNode.moveTop();
    if(props.windowNode.windowInfo.state === 'minimize'){
        props.windowNode.restore();
    }
}
</script>
<style lang="scss" scoped>
.appicon{
    width: var(--bar-height);
    height: var(--bar-height);
    display: flex;
    justify-content: center;
    align-items: center;
    .appicon-img{
        user-select: none;
        width: 60%;
        height: 60%;
    }
}
.appicon:hover{
    background-color: var(--color-gray-hover);
}
</style>