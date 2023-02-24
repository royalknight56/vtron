<template>
    <div class="background" @click="backgroundClick">
    </div>
</template>
<script lang="ts" setup>
import { emitEvent, mountEvent } from "@packages/feature/event";
function backgroundClick(e: MouseEvent) {
    emitEvent('desktop.background.leftClick', e);
}

</script>
<style lang="scss" scoped>
.background {
    width: 100%;
    height: 100%;
    background-color: #3a98ce;
}
</style>