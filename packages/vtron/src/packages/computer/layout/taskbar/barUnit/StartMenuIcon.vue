<template>
  <div class="startmenuicon" @click.stop="emitClick">
    <img class="startmenuicon-img" :src="sys?._options.logo || winimg" />
  </div>
  <Transition name="startmenu">
    <StartMenu v-if="isStartmenuShow" class="startmenu"></StartMenu>
  </Transition>
</template>
<script lang="ts" setup>
import winimg from '@/assets/win.png';
import { System } from '@packages/kernel';
import { inject, ref } from 'vue';
import StartMenu from '@/packages/computer/layout/taskbar/startMenu/StartMenu.vue';

const sys = inject<System>('system')!;
const isStartmenuShow = ref(false);
sys.mountEvent('startmenu.changeVisible', function () {
  isStartmenuShow.value = !isStartmenuShow.value;
});
sys.mountEvent('startmenu.hidden', function () {
  isStartmenuShow.value = false;
});
function emitClick(e: MouseEvent) {
  sys.emitEvent('taskbar.startmenu.leftClick', e);
}
</script>
<style lang="scss" scoped>
.startmenuicon {
  width: var(--startmenu-icon-size);
  height: var(--task-bar-height);
  background-color: var(--theme-main-color);
  user-select: none;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 41;
}

.startmenuicon-img {
  // width: 50%;
  height: 40%;
}

.startmenu {
  position: absolute;
  bottom: var(--task-bar-height);
  left: 0;
}

.startmenuicon:hover {
  background-color: var(--color-gray-hover);

  .startmenuicon-img {
    opacity: 0.5;
  }
}

.startmenu-enter-active {
  transition: all 0.3s var(--aniline);
}

.startmenu-leave-active {
  transition: all 0.05s;
}

.startmenu-enter-from {
  transform: translateY(100px);
  opacity: 0;
}

.startmenu-leave-to {
  transform: translateY(350px);
  opacity: 0;
}
</style>
@/packages/kernel/system@/packages/kernel/event
