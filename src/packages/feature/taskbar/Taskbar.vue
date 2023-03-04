<template>
    <div class="taskbar">
        <StartMenu></StartMenu>
        <AppIconGroup></AppIconGroup>
    </div>
</template>
<script lang="ts" setup>
import StartMenu from './barUnit/StartMenuIcon.vue';
import AppIconGroup from '@packages/feature/taskbar/barUnit/AppIconGroup.vue';

</script>
<style lang="scss" scoped>
.taskbar{
    width: 100%;
    height:var(--bar-height);
    background-color: var(--color-gray);
    display: flex;
    position: relative;
}
</style>