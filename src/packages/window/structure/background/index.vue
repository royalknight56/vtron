<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 18:59:43
 * @Description: 
-->
<template>
    <div class="background-outer" @contextmenu.prevent="backgroundRightClick">
        <defaultBackground v-if="appconfig.backimg === 'default'"></defaultBackground>
        <imgBackground v-else></imgBackground>
    </div>
</template>
<script lang="ts" setup>
import { appconfig } from "@/packages/appconfig";
import { ContextMenu } from "@libs/ContextMenu";

import defaultBackground from "@structure/background/default.vue";
import imgBackground from "@structure/background/imgbackground.vue";
// import Background from '@structure/background/background.vue';
// import BlackScreen from '@structure/background/blackScreen.vue';
// import BlueScreen from '@structure/background/blueScreen.vue';

import {System} from '@libs/System'
import { inject } from "vue";
let system =<System>inject('system');

function backgroundRightClick(e: MouseEvent) {
    system.ContextMenu.callMenu(e,
        [
            { name: '刷新', func: () => { } },
        ]
    )
}
</script>