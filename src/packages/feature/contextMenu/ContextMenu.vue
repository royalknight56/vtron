<template>
    <div :style="{
        top: y + 'px',
        left: x + 'px'
    }" class="contextmenu" v-show="isVisiable">
        <div class="contextmenu-item" v-for="item in menuList" :key="item.name">
            <div @click="handleClick(item)">{{ item.name }}</div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { mountEvent, emitEvent } from '../event';
import { useRootState } from '../state/Root';
let isVisiable = ref(false);
let x = ref(0);
let y = ref(0);
let menuList = ref<{
    name: string;
    click: () => void;
}[]>([]);
mountEvent('contextMenu.show', (source, data) => {
    if(!data.menuList || data.menuList?.length === 0){
        return;
    }
    isVisiable.value = true;
    // get window inner width and height
    let innerWidth = useRootState().system.info.screenWidth;
    let innerHeight =useRootState().system.info.screenHeight;
    // get contextmenu width
    let contextmenuWidth = 160;
    // get contextmenu height
    let contextmenuHeight = 24 * data.menuList.length;
    // get mouse position
    let mouseX = data.mouse.clientX;
    let mouseY = data.mouse.clientY;
    // get contextmenu position
    let contextmenuX = mouseX + contextmenuWidth > innerWidth ? mouseX - contextmenuWidth : mouseX;
    let contextmenuY = mouseY + contextmenuHeight > innerHeight ? mouseY - contextmenuHeight : mouseY;

    x.value = contextmenuX;
    y.value = contextmenuY;
    menuList.value = data.menuList;
})
mountEvent('contextMenu.hidden', (e) => {
    isVisiable.value = false;
});

function handleClick(item: {
    name: string;
    click: () => void;
}) {
    item.click();
    emitEvent('contextMenu.hidden');
}
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
    user-select: none;
    .contextmenu-item {
        height: var(--ui-list-item-height);
        line-height: var(--ui-list-item-height);
        font-size: var(--ui-font-size);
        padding: 2px 10px;
        cursor: pointer;

        &:hover {
            background-color: #fefefe;
        }
    }
}
</style>