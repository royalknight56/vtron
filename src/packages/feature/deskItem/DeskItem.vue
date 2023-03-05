<template>
    <div class="desk-group">
        <div @dblclick="openapp(item)" class="desk-item" v-for="item in appList" :key="item.name">
            <img class="desk-item_img" :src="item.icon" alt="">
            <span class="desk-item_title">{{ item.name }}</span>
        </div>
    </div>

</template>
<script lang="ts" setup>

import { useAppOpen } from '@/packages/hook/useAppOpen';

const { openapp, appList } = useAppOpen('apps');

// import { useRootState } from '../state/Root';
// import { BrowserWindow } from '../window/BrowserWindow';
// import { WinApp } from '@packages/type/type';
// import { UnwrapNestedRefs } from 'vue';
// let rootState = useRootState();
// let appList = rootState.system.apps;
// function openapp(item: UnwrapNestedRefs<WinApp>) {
//     item.window?.show();
// }
</script>
<style lang="scss" scoped>
.desk-group {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    height: 100%;
    user-select: none;

    .desk-item {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: var(--desk-item-size);
        height: var(--desk-item-size);
        font-size: var(--ui-font-size);
        margin: 6px;
        .desk-item_img {
            width: 60%;
            height: 60%;
            margin: 4px auto;
        }

        .desk-item_title {
            display: block;
            text-align: center;
        }
    }
    .desk-item:hover{
        background-color: #3bdbff4c;
    }
}
</style>