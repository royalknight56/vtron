<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-01-27 15:15:01
 * @Description: 磁贴
 * @FilePath: /myindex/src/components/window/Magnet.vue
  Need CodeReview 
-->
<template>
    <div class="magnet" @click.stop>
        <div class="m_left">
            <div class="left_list_item" @click="closeClice">
                <svg
                    class="icon"
                    viewBox="0 0 1024 1024"
                    width="200"
                    height="200"
                >
                    <path
                        d="M537 625.2h-50v-560h50v560z m135-509.7V170c40.4 18.8 76.9 44.3 108.7 76.1 34.9 34.9 62.3 75.6 81.5 120.8C882 413.7 892 463.5 892 514.8s-10 101.1-29.8 147.9c-19.1 45.2-46.5 85.9-81.5 120.8-34.9 34.9-75.6 62.3-120.8 81.5-46.8 19.8-96.6 29.8-147.9 29.8-51.3 0-101.1-10-147.9-29.8-45.2-19.1-85.9-46.5-120.8-81.5-34.9-34.9-62.3-75.6-81.5-120.8C142 615.9 132 566.1 132 514.8s10-101.1 29.8-147.9c19.1-45.2 46.5-85.9 81.5-120.8 31.8-31.8 68.3-57.3 108.7-76.1v-54.5C193.8 179 82 333.8 82 514.8c0 237.5 192.5 430 430 430s430-192.5 430-430c0-181-111.8-335.8-270-399.3z"
                    />
                </svg>
                <div class="item_text">关机</div>
            </div>
        </div>
        <div class="m_right">
            <div class="right_item" v-for="item in mangList" @click="manclick(item)">
                <div class="right_item_img">
                    <img :src="item.icon" />
                </div>

                <div class="right_item_text">{{ item.name }}</div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { appList } from "../../appconfig";
import type { appInfo } from "../../appconfig";
import { SystemStatus } from "../libs/SystemStatus";

import { MenuCtrl } from "../libs/MenuCtrl";
import { UnwrapNestedRefs } from "@vue/reactivity";

function closeClice(e: MouseEvent) {
    MenuCtrl.getInstance().callMenu(e,
        [
            { name: '关机', func: () => { console.log("关机"); SystemStatus.getInstance().closePower() } },
            { name: '锁定', func: () => { SystemStatus.getInstance().lockScreen() } },
            { name: '重启', func: () => { console.log("重启"); SystemStatus.getInstance().restartPower() } }

        ]
    )
}
let mangList = appList

function manclick(item: UnwrapNestedRefs<appInfo>) {
    item.window.show()
}
</script>
<style scoped>
.magnet {
    position: absolute;
    left: 0;
    bottom: 30px;
    width: 500px;
    height: 400px;
    z-index: -1;
    animation: manshow 0.2s;
    /* background-color: black; */
    backdrop-filter: saturate(180%) blur(20px) brightness(60%);
    background-color: rgba(0, 0, 0, 0.322);
}
/* @supports (background: -moz-element(#bg)) {
    .g-glossy-firefox {
        display: block;
        position: fixed;
        width: 600px;
        height: 300px;
        background: -moz-element(#bg) no-repeat;
        filter: blur(10px);
    }
} */
@keyframes manshow {
    0% {
        transform: translateY(10%);
        opacity: 0;
    }
    100% {
        transform: translateY(0%);
        opacity: 1;
    }
}

.m_left {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 50px;
    height: 100%;
    background-color: rgba(36, 32, 26, 0.61);
    display: flex;
    flex-direction: column-reverse;
    transition: all 0.2s;
    overflow: hidden;
}
.m_left:hover {
    width: 200px;
    background-color: rgba(36, 32, 26, 0.945);
}

.left_list_item {
    transition: all 0.2s;
    color: white;
    /* text-align: center; */
    font-size: small;
    display: flex;
    flex-shrink: 0;
}
.left_list_item:hover {
    background-color: rgba(255, 255, 255, 0.267);
}
.left_list_item .item_text {
    flex-shrink: 0;
    line-height: 40px;
}
.left_list_item svg {
    flex-shrink: 0;
    width: 30px;
    height: 20px;
    filter: invert(100%);
    padding: 10px;
}

.m_right {
    position: absolute;
    left: 60px;
    top: 10px;
    bottom: 0;
    height: 100%;
    width: 450px;
    z-index: -1;
    display: grid;
    justify-content: start;
    align-items: start;
    justify-items: center;
    align-content: space-between;
    grid-template-columns: 100px 100px 100px 100px;
    grid-template-rows: 100px 100px 100px 100px;
    grid-gap: 2px;
    grid-template-areas:
        "a b c d"
        "e f g h"
        "i j k l";
    /* background-color: wheat; */
}
.right_item {
    width: 100%;
    height: 100%;
    background-color: rgba(184, 184, 184, 0.349);
    line-height: 100px;
    text-align: center;
    position: relative;
    color: whitesmoke;
}
.right_item:hover {
    background-color: rgba(224, 224, 224, 0.349);
}
.right_item_img {
    width: 100%;
    height: 33%;
}
.right_item img {
    width: 60%;
    padding: 5px;
}
.right_item_text {
    font-size: small;
    height: 10%;
}
</style>