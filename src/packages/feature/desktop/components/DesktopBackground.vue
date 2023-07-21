<template>
    <div v-if="backgroundType === 'image'" class="background">
        <Transition name="fade">
            <img v-show="loaded" draggable="false" @load="imgload" class="background_load" :src="background">
        </Transition>
    </div>
    <div v-else class="background" :style="{ backgroundColor: background }">
    </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useRootState } from '../../state/Root';
let rootState = useRootState();
let backgroundType = ref('color');
let background = ref('#3A98CE');
let loaded = ref(false);


function imgload() {
    loaded.value = true;
}
onMounted(() => {
    refershBack(rootState.system.options.background)
})
watch(rootState.system.options, (nv, ov) => {
    refershBack(nv.background)
})
function refershBack(val: string | undefined) {
    background.value = val || "#3A98CE";

    if (background.value.startsWith("#")) {
        backgroundType.value = 'color';
    } else {
        backgroundType.value = 'image';
    }
}
</script>
<style lang="scss" scoped>
.background {
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.704);

    .background_unload {
        width: 100%;
        height: 100%;
    }

    .background_load {
        width: 100%;
        height: 100%;
        object-fit: cover;
        user-select: none;
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: all 0.5s ease;
}

.fade-enter-to,
.fade-leave-from {
    opacity: 0.8;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>