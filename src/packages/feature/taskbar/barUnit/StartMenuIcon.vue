<template>
    <div class="startmenuicon" @click.stop="emitClick">
        <img class="startmenuicon-img" :src="winimg">
    </div>
    <Transition name="startmenu">
        <StartMenu v-if="isStartmenuShow" class="startmenu"></StartMenu>
    </Transition>
</template>
<script lang="ts" setup>
import winimg from "@/assets/win.png"
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
    width:var(--startmenu-icon-width);
    height: var(--bar-height);
    background-color: var(--color-gray);
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
}

.startmenuicon-img {
    // width: 50%;
    height: 40%;
}

.startmenu {
    position: absolute;
    bottom: var(--bar-height);
    left: 0;
}

.startmenuicon:hover {
    background-color: var(--color-gray-hover);

    .startmenuicon-img {
        opacity: 0.5;
    }

}

.startmenu-enter-active {
    transition: all 0.2s ease;
}

.startmenu-leave-active {
    transition: all 0.05s;
}

.startmenu-enter-from {
    transform: translateY(50px);
    opacity: 0;
}

.startmenu-leave-to {
    transform: translateY(350px);
    opacity: 0;
}
</style>