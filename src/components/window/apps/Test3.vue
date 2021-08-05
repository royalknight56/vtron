<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-05 17:39:09
 * @Description: 
 * @FilePath: /myindex/src/components/window/apps/Test3.vue
-->
<template>
    <div class="outer">
        <div class="uper">
            <input class="urlinput" v-model="urlinput" @keydown="urlkey"/>
            <button class="change button" @click="changeUrl">-</button>
        </div>
        
        <iframe class="broifame" :src="urlsrc"></iframe>
    </div>
</template>
<script lang="ts" setup>
import { ref } from "@vue/reactivity";
let urlinput = ref('')
let urlsrc = ref('')
function urlkey(e:KeyboardEvent) {
    if (e.code == 'Enter') {
        changeUrl()
    }
}
function changeUrl() {
    urlsrc.value=urlinput.value
}
</script>
<style>
iframe {
    overflow: auto;
    width: 100%;
    height: 100%;
}
</style>
<style scoped>
.outer {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}
.urlinput {
    width: 100%;
}
.uper{
    display: flex;
}
.broifame{
    /* height: 100%; */
    width: 100%;
}
</style>