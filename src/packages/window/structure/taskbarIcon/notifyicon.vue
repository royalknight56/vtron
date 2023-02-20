<template>
    <div @click="changeNotifyShow" class="notifyicon">
        <span class="segoicon SEGOEUIMDL"> &#xE91C;</span>
    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';

let ifNotifyShow = ref(false);
function changeNotifyShow() {
    ifNotifyShow.value = !ifNotifyShow.value
}
</script>
<style scoped>
@import "@/packages/main.css";
</style>