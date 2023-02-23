<template>
    <div class="startmenu" @click="emitClick">

    </div>
</template>
<script lang="ts" setup>
import { emitEvent } from "@packages/feature/event";
function emitClick(e: MouseEvent){
    emitEvent('taskbar.startmenu.leftClick',e);
}
</script>
<style lang="scss" scoped>
.startmenu{
    width: var(--bar-height);
    height: var(--bar-height);
    background-color: #e58220;
}
</style>