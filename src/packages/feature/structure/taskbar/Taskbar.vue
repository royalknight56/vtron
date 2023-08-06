<template>
  <div class="taskbar">
    <StartMenu></StartMenu>
    <AppIconGroup></AppIconGroup>
    <StateIcon></StateIcon>
  </div>
</template>
<script lang="ts" setup>
import StartMenu from '@feature/structure/taskbar/barUnit/StartMenuIcon.vue';
import AppIconGroup from '@feature/structure/taskbar/barUnit/AppIconGroup.vue';
import StateIcon from '@feature/structure/taskbar/barUnit/StateIcon.vue';
</script>
<style lang="scss" scoped>
.taskbar {
  width: 100%;
  height: var(--task-bar-height);
  background-color: var(--color-gray);
  display: flex;
  position: relative;
}
</style>
