<template>
    <div class="startmenuicon" @click.stop="emitClick">

    </div>
    <Transition name="startmenu">
        <StartMenu v-if="isStartmenuShow" class="startmenu"></StartMenu>
    </Transition>
</template>
<script lang="ts" setup>
import WinLogo from "@/packages/components/WinLogo.vue";
import { emitEvent, mountEvent } from "@packages/feature/event";
import { ref } from "vue";
import StartMenu from "../../startMenu/StartMenu.vue";

let isStartmenuShow = ref(false);
mountEvent('startmenu.changeVisible', function (e: string, data: any) {
    isStartmenuShow.value = !isStartmenuShow.value;
});
mountEvent('startmenu.hidden', function (e: string, data: any) {
    isStartmenuShow.value = false;
});
function emitClick(e: MouseEvent) {
    emitEvent('taskbar.startmenu.leftClick', e);
}
</script>           
<style lang="scss" scoped>
.startmenuicon {
    width: var(--bar-height);
    height: var(--bar-height);
    background-color: var(--color-gray);
}

.startmenu {
    position: absolute;
    bottom: var(--bar-height);
    left: 0;
}

.startmenuicon:hover {
    background-color: var(--color-gray-hover);
}

.startmenu-enter-active{
    transition: all 0.3s ease;
}
.startmenu-leave-active {
    transition: all 0.05s;
}

.startmenu-enter-from{
    transform: translateY(50px);
    opacity: 0;
}
.startmenu-leave-to {
    transform: translateY(350px);
    opacity: 0;
}
</style>