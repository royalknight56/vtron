<template>
    <div class="startmenuicon" @click.stop="emitClick">
    </div>
    <Transition name="startmenu">
        <StartMenu v-if="isStartmenuShow" class="startmenu"></StartMenu>
    </Transition>
</template>
<script lang="ts" setup>
import { emitEvent, mountEvent } from "@packages/feature/event";
import { ref } from "vue";
import StartMenu from "../../startMenu/StartMenu.vue";
let isStartmenuShow = ref(false);
mountEvent('startmenu.changeVisible', function (e: string, data: any) {
    isStartmenuShow.value = !isStartmenuShow.value;
    console.log('startmenu.changeVisible')
});
mountEvent('startmenu.hidden', function (e: string, data: any) {
    isStartmenuShow.value = false;
    console.log('startmenu.hidden')

});
function emitClick(e: MouseEvent) {
    emitEvent('taskbar.startmenu.leftClick', e);
}
</script>           
<style lang="scss" scoped>
.startmenuicon {
    width: var(--bar-height);
    height: var(--bar-height);
    background-color: #e58220;
}
.startmenu{
    position: absolute;
    bottom: var(--bar-height);
    left: 0;
}
.startmenu-enter-active,
.startmenu-leave-active {
  transition: opacity 0.5s ease;
}

.startmenu-enter-from,
.startmenu-leave-to {
  opacity: 0;
}
</style>