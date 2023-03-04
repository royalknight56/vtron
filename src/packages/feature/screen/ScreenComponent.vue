<template>
    <div class="screen" @contextmenu.prevent="" ref="screen">
        <template v-if="rootState.system.state==SystemStateEnum.close">
            <CloseDesktop></CloseDesktop>
        </template>
        <template v-else-if="rootState.system.state==SystemStateEnum.opening">
            <OpeningDesktop></OpeningDesktop>
        </template>
        <template v-else-if="rootState.system.state==SystemStateEnum.open">
            <OpenDesktop></OpenDesktop>
        </template>
    </div>
</template>
<script lang="ts" setup>
import CloseDesktop from "@/packages/feature/desktop/CloseDesktop.vue";
import OpenDesktop from "@/packages/feature/desktop/OpenDesktop.vue";
import OpeningDesktop from "@/packages/feature/desktop/OpeningDesktop.vue";
import { SystemStateEnum } from "@/packages/type/enum";
import {useRootState} from "@/packages/feature/state/Root";
import { onMounted, ref } from "vue";

let rootState = useRootState();
let screen = ref<HTMLElement>();
onMounted(()=>{
    rootState.ref = screen.value;
})
</script>
<style lang="scss" scoped>
@import "@/packages/root.scss";
.screen{
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
</style>