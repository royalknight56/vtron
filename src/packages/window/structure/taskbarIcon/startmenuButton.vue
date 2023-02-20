<template>
    <div class="winitem_first" @click.prevent.stop="barFirskClick">
        <img draggable="false" :src="winlogo" />
    </div>
    <StartMenuVue v-if="ifMagnetShow" @changevis="changeMagnetShow"></StartMenuVue>
</template>
<script setup lang="ts">
import { computed, inject, ref } from "vue";
import winimg from "@/assets/win.png"
import { System } from '@libs/System'
import StartMenuVue from "@structure/StartMenu.vue";
let system = <System>inject('system');
const appconfig = system.SystemConfig.config
//设置winlogo
let winlogo = ref(winimg);
if (appconfig.start_menu_logo == "default") {
    winlogo.value = winimg;
} else {
    winlogo.value = appconfig.start_menu_logo;
}


let ifMagnetShow = ref(false)
function barFirskClick(e: MouseEvent) {
    ifMagnetShow.value = !ifMagnetShow.value
    document.addEventListener("click", (e) => {
        ifMagnetShow.value = false
    }, {
        once: true
    })
}

function changeMagnetShow() {
    ifMagnetShow.value = !ifMagnetShow.value
}

</script>
<style scoped>
.winitem_first {
    user-select: none;
    flex-shrink: 0;
    height: var(--bar-height);
    width: calc(var(--bar-height) * 4 / 3);
    line-height: var(--bar-height);
    text-align: center;
    /* border-radius: 25px; */
    color: white;
    /* background-color: rgb(87, 147, 182); */
    background-color: rgba(97, 97, 97, 0);

    /* box-shadow: 0 0 10px 2px rgb(87, 147, 182); */
    transition: all 0.2s;
}

.winitem_first img {
    width: 30%;
    display: inline-block;
    vertical-align: middle;
    /* filter: invert(100%); */
}

.winitem_first:hover {
    background-color: #e5f2fa;
    box-shadow: 1px 2px 10px 2px rgb(231, 231, 231);
    /* filter: brightness(140%); */
}

</style>