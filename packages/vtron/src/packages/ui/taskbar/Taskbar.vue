<template>
  <div class="taskbar">
    <StartMenuIcon></StartMenuIcon>
    <AppIconGroup></AppIconGroup>
    <StateIcon></StateIcon>
  </div>
</template>
<script lang="ts" setup>
import StartMenuIcon from './barUnit/StartMenuIcon.vue';
import AppIconGroup from './barUnit/AppIconGroup.vue';
import StateIcon from './barUnit/StateIcon.vue';
</script>
<style lang="scss" scoped>
.taskbar {
  width: 100%;
  height: var(--task-bar-height);
  background-color: var(--theme-main-color);
  display: flex;
  position: relative;
}
</style>
