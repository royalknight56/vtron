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
            <button @click="getRemoteVersion">检查更新</button>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
let localVersion = ref('0.3.6')
let remoteVersion = ref('0.0.0')

function getRemoteVersion() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.npms.io/v2/package/vue3-win10');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {

                let data = JSON.parse(xhr.responseText)
                // console.log(data.collected.metadata.version)
                remoteVersion.value = data.collected.metadata.version
                // version.value = data.tag_name
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