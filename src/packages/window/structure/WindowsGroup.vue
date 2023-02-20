<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:34:05
 * @Description: 
 * @FilePath: /myindex/src/components/window/WindowsGroup.vue
  Need CodeReview 
-->
<template>
    <template v-if="isMount" v-for="item in windowCreacted"  :key="item.id">
        <div class="winitem" >
            <teleport :to="'#' + system.id">
                <WindowTmpVue :id="item.id" :ref="'ref' + item.id"></WindowTmpVue>
            </teleport>
        </div>
    </template>

</template>
<script setup lang="ts">
import WindowTmpVue from "@/packages/window/structure/WindowTemplate.vue";

import { System } from '@libs/System'
import { computed, inject, onMounted, ref } from "vue";
import { windowInfoMapInter } from "@libs/DragWindow/option";
import { DragWindow } from "@libs/DragWindow";

let system = <System>inject('system')

let isMount = ref(false)
onMounted(() => {
    isMount.value = true
})
let windowCreacted = computed(() => {
    let Obj: windowInfoMapInter = {};
    Object.keys(system.State.windowInfoMap).forEach((key) => {
        if (system.State.windowInfoMap[key].windowInfo.isCreate) {
            Obj[key] = system.State.windowInfoMap[key].windowInfo
        }
    })
    return Obj
})

</script>
<style scoped>
@import '../../main.css';

.winitem {
    position: relative;
    z-index: 2;

}
</style>