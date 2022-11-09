<template>
    <div class="set_left"></div>
    <div class="set_dash">
        <div class="set_item">
            当前版本
            ：{{ localVersion }}
        </div>
        <div v-if="remoteVersion!='0.0.0'" class="set_item">
            最新版本
            ：{{ remoteVersion }}
        </div>
        <div class="set_item">
            <button v-if="updateButtonShow" @click="getRemoteVersion">检查更新</button>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
let localVersion = ref('0.4.0')
let remoteVersion = ref('0.0.0')
let updateButtonShow = ref(true)
function getRemoteVersion() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.npms.io/v2/package/vue3-win10');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                let data = JSON.parse(xhr.responseText)
                remoteVersion.value = data.collected.metadata.version
                updateButtonShow.value = false
            }
        }
    }
    xhr.send()

}
getRemoteVersion()

</script>
<style lang="scss" scoped>
@import "@/packages/main.css";
@import "./setStyle.scss";
</style>