<template>
    <div class="screen">
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

let rootState = useRootState();

</script>
<style lang="scss" scoped>
.screen{
    width: 100%;
    height: 100%;
}
</style>