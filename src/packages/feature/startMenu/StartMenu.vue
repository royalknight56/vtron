<template>
    <div class="startmenu">
        <div class="startmenu-item">
            <StartOption></StartOption>
        </div>
        <div class="startmenu-item">
            <MenuList></MenuList>
        </div>
        <div class="startmenu-item">
            <Magnet></Magnet>
        </div>
    </div>
</template>
<script lang="ts" setup>
import Magnet from './components/Magnet.vue';
import MenuList from './components/MenuList.vue';
import StartOption from './components/StartOption.vue';

</script>
<style lang="scss" scoped>
.startmenu {
    --startmenu-width: 600px;
    --startmenu-height: 400px;
    // width: var(--startmenu-width);
    height: var(--startmenu-height);
    background-color: var(--color-startmenu-opacity);
    backdrop-filter: blur(10px);
    z-index: 40;
    display: flex;
    overflow: hidden;
}
.startmenu-item{
    position: relative;
}
</style>