<template>
    <div class="taskbar">
        <StartMenu></StartMenu>
        <AppIcon></AppIcon>
    </div>
</template>
<script lang="ts" setup>
import StartMenu from './barUnit/StartMenuIcon.vue';
import AppIcon from './barUnit/AppIcon.vue';

</script>
<style lang="scss" scoped>
.taskbar{
    --bar-height: 40px;
    width: 100%;
    height:var(--bar-height);
    background-color: #000;
    display: flex;
}
</style>