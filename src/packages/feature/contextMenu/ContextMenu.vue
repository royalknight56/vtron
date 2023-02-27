<template>
    <div :style="{
        top: y + 'px',
        left: x + 'px'
    }" class="contextmenu" v-show="isVisiable">
        <div class="contextmenu-item" v-for="item in menuList" :key="item.name">
            <div @click="item.click">{{ item.name }}</div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { mountEvent } from '../event';
let isVisiable = ref(false);
let x = ref(0);
let y = ref(0);
let menuList = ref<{
    name: string;
    click: () => void;
}[]>([]);
mountEvent('contextMenu.show', (source, data) => {
    isVisiable.value = true;
    x.value = data.mouse.clientX;
    y.value = data.mouse.clientY;
    menuList.value = data.menuList;
})
mountEvent('contextMenu.hidden', (e) => {
    isVisiable.value = false;
})
</script>
<style lang="scss" scoped>
.contextmenu {
    position: absolute;
    top: 0px;
    left: 0px;
    width: var(--contextmenu-width);
    z-index: 100;
    background-color: #eeeeee;
    border: 1px solid #909090;
    padding: 2px 0px;
    .contextmenu-item{
        height: var(--ui-list-item-height);
        line-height: var(--ui-list-item-height);
        font-size: var(--ui-font-size);
        padding:2px 10px;
        cursor: pointer;
        &:hover{
            background-color: #fefefe;
        }
    }
}
</style>