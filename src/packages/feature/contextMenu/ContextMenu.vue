<template>
    <div class="contextmenu" v-show="isVisiable">

    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { mountEvent } from '../event';
let isVisiable = ref(false);
mountEvent('contextMenu.show', (e) => {
    console.log(e);
    isVisiable.value = true;
})
mountEvent('contextMenu.close', (e) => {
    console.log(e);
    isVisiable.value = false;
})
</script>
<style lang="scss" scoped>
.contextmenu{
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100px;
    height: 100px;
    background-color: rgb(21, 255, 0);
}
</style>