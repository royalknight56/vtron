<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-16 10:32:29
 * @Description: 磁贴
 * @FilePath: /myindex/src/components/window/Magnet.vue
-->
<template>
    <div class="magnet" @click.stop>
        <div class="m_left">
            <div class="left_list_item" @click="closeClice">
                <svg
                    t="1628247206921"
                    class="icon"
                    viewBox="0 0 1024 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="2013"
                    width="200"
                    height="200"
                >
                    <path
                        d="M537 625.2h-50v-560h50v560z m135-509.7V170c40.4 18.8 76.9 44.3 108.7 76.1 34.9 34.9 62.3 75.6 81.5 120.8C882 413.7 892 463.5 892 514.8s-10 101.1-29.8 147.9c-19.1 45.2-46.5 85.9-81.5 120.8-34.9 34.9-75.6 62.3-120.8 81.5-46.8 19.8-96.6 29.8-147.9 29.8-51.3 0-101.1-10-147.9-29.8-45.2-19.1-85.9-46.5-120.8-81.5-34.9-34.9-62.3-75.6-81.5-120.8C142 615.9 132 566.1 132 514.8s10-101.1 29.8-147.9c19.1-45.2 46.5-85.9 81.5-120.8 31.8-31.8 68.3-57.3 108.7-76.1v-54.5C193.8 179 82 333.8 82 514.8c0 237.5 192.5 430 430 430s430-192.5 430-430c0-181-111.8-335.8-270-399.3z"
                        fill
                        p-id="2014"
                    />
                </svg>
                <div class="item_text">关机</div>
            </div>
            <div class="left_list_item">
                <svg
                    t="1628248134723"
                    class="icon"
                    viewBox="0 0 1024 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="2843"
                    width="200"
                    height="200"
                >
                    <path
                        d="M661.636 917.743h-0.006c-16.273-0.008-32.097-6.733-42.312-18.008-13.921-15.264-58.031-54.955-94.135-54.955-35.857 0-80.65 39.921-93.515 53.902-10.192 11.084-25.904 17.7-42.02 17.7-7.681 0-14.923-1.47-21.54-4.378l-1.16-0.503-109.745-61.374-1.092-0.761c-19.976-13.987-27.58-41.343-17.68-63.634 0.077-0.167 10.123-23.351 10.123-44.49 0-64.146-52.19-116.337-116.335-116.337h-3.89c-0.24 0.009-0.479 0.014-0.704 0.014-18.378 0-33.337-16.323-38.123-41.587-0.379-2.026-9.36-49.938-9.36-87.688 0-37.753 8.978-85.67 9.36-87.695 4.84-25.582 20.125-42.015 38.828-41.575h3.89c64.146 0 116.335-52.19 116.335-116.332 0-21.132-10.041-44.311-10.148-44.544-9.889-22.266-2.235-49.619 17.832-63.56l1.137-0.788 115.82-63.621 1.206-0.512c6.524-2.78 13.665-4.19 21.232-4.19 16.086 0 31.824 6.473 42.114 17.316 13.709 14.35 57.036 51.681 92.108 51.681 34.744 0 77.81-36.59 91.471-50.692 10.233-10.62 25.86-16.983 41.782-16.983 7.72 0 14.996 1.46 21.628 4.34l1.17 0.512 111.866 62.148 1.104 0.774c20.017 13.965 27.639 41.324 17.731 63.625-0.072 0.17-10.124 23.355-10.124 44.493 0 64.143 52.19 116.332 116.334 116.332h3.896c18.673-0.416 33.98 15.99 38.822 41.575 0.38 2.024 9.36 49.936 9.36 87.688 0 37.755-8.98 85.67-9.367 87.694-4.837 25.584-20.144 41.955-38.824 41.573h-3.887c-64.144 0-116.334 52.191-116.334 116.337 0 21.128 10.042 44.304 10.145 44.534 9.882 22.257 2.243 49.614-17.786 63.567l-1.119 0.786L683.967 913l-1.183 0.514c-6.511 2.803-13.621 4.229-21.148 4.229z m-3.455-53.594c0.506 0.332 1.946 0.896 3.455 0.896 0.062 0 0.118 0 0.17-0.004l106.28-58.74c-2.566-5.957-14.295-34.885-14.295-65.05 0-90.232 71.065-164.178 160.167-168.802 1.28-7.082 8.242-46.918 8.242-76.801 0-29.883-6.962-69.7-8.242-76.803-89.1-4.627-160.167-78.573-160.167-168.8 0-30.213 11.765-59.175 14.308-65.09l-104.555-58.089c-0.12-0.005-0.268-0.016-0.439-0.016-1.78 0-3.443 0.65-3.996 1.023-1.758 1.804-16.91 17.173-38.682 32.486-32.226 22.67-62.697 34.167-90.575 34.167-28.142 0-58.86-11.724-91.292-34.84-21.906-15.609-37.132-31.274-38.89-33.111-0.557-0.377-2.245-1.046-4.04-1.046-0.14 0-0.263 0.005-0.372 0.011l-108.299 59.482c2.6 6.033 14.283 34.909 14.283 65.025 0 90.226-71.063 164.172-160.166 168.8-1.28 7.086-8.241 46.916-8.241 76.802 0 29.88 6.96 69.695 8.248 76.795 89.094 4.63 160.16 78.572 160.16 168.801 0 30.278-11.812 59.286-14.328 65.124l102.502 57.316c0.064 0.009 0.143 0.009 0.23 0.009 1.495 0 2.914-0.55 3.423-0.877 1.916-2.055 17.223-18.262 39.277-34.425 32.866-24.09 64.1-36.3 92.836-36.3 29.004 0 60.477 12.443 93.535 36.994 22.18 16.466 37.554 32.973 39.463 35.063zM525.556 649.985c-85.424 0-154.923-69.501-154.923-154.928 0-85.424 69.5-154.924 154.923-154.924 85.428 0 154.932 69.5 154.932 154.924 0 85.427-69.504 154.928-154.932 154.928z m0-257.156c-56.368 0-102.224 45.858-102.224 102.226 0 56.372 45.857 102.231 102.224 102.231 56.373 0 102.238-45.859 102.238-102.23 0-56.369-45.863-102.227-102.238-102.227z"
                        fill
                        p-id="2844"
                    />
                </svg>
                <div class="item_text">设置</div>
            </div>
        </div>
        <div class="m_right">
            <div class="right_item" v-for="item in mangList" @click="manclick(item)">
                <div class="right_item_img">
                    <img :src="item.icon" />
                </div>
                
                <div class="right_item_text">
                    {{item.name}}
                </div>
            </div>
            <!-- <div class="right_item">
                <img src="/default.png" />
            </div>
            <div class="right_item">
                <img src="/default.png" />
            </div> -->
        </div>
    </div>
</template>
<script lang="ts" setup>
import {appList} from "../appconfig";
import type {appInfo} from "../appconfig";
import { computerCTC } from "./libs/computerCTC";
import { MenuIPC } from "./libs/MenuIPC";
import { DragWindow } from "./libs/DragWindow";

function closeClice(e: MouseEvent) {
    MenuIPC.getInstance().callMenu(e.pageX, e.pageY,
        [
            { name: '关机', func: () => { console.log("关机"); computerCTC.getInstance().closePower() } },
            { name: '重启', func: () => { console.log("重启"); computerCTC.getInstance().restartPower() } }

        ]
    )
}
let mangList = appList

function manclick(item:appInfo) {
    import('../../apps/'+item.apptemp+'.vue').then((mod)=>{
            let win = new DragWindow(100, 100, item.name, item.width, item.height,{content:mod.default})
    })
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
    backdrop-filter: saturate(180%) blur(20px) brightness(40%);
}
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
.right_item:hover{
    background-color: rgba(224, 224, 224, 0.349);
}
.right_item_img{
    width: 100%;
    height: 33%;
}
.right_item img {
    width: 60%;
    padding: 5px;
}
.right_item_text{
    font-size: small;
    height: 10%;
}
</style>