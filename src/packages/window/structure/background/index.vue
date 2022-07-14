<!--
 * @Author: Royal
 * @LastEditTime: 2022-05-29 15:54:52
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
import { MenuCtrl } from "@libs/MenuCtrl";

import defaultBackground from "@structure/background/default.vue";
import imgBackground from "@structure/background/imgbackground.vue";
// import Background from '@structure/background/background.vue';
// import BlackScreen from '@structure/background/blackScreen.vue';
// import BlueScreen from '@structure/background/blueScreen.vue';


function backgroundRightClick(e: MouseEvent) {
    MenuCtrl.getInstance().callMenu(e,
        [
            { name: '刷新', func: () => { } },
        ]
    )
}
</script>