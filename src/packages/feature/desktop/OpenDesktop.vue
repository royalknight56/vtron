<template>
    <div class="desktop">
        <div class="userarea"></div>
        <Taskbar></Taskbar>
    </div>

</template>
<script lang="ts" setup>
import Taskbar from '../taskbar/Taskbar.vue';
</script>
<style lang="scss" scoped>
.desktop {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    flex-grow: 0;

    .userarea {
        flex: 1;
        background-color: #3a98ce;
    }
}
</style>