
<template>
  <div class="appstore">
    软件商店
    <div class="applist">
      <div v-for="item in appList" class="appitem">
        {{item.appName}}--
        {{item.version}}
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, reactive } from 'vue';
interface AppListItem {
  appName: string;
  version: string;
}
let appList:Array<AppListItem> = reactive([])
function getAppList() {
  return fetch('http://localhost:3002/list',
    {
      method: 'GET',
    }).then(response => response.json())
    .then(list => {
      appList.push(...list)
    })
}
getAppList()
</script>
<style scoped>
@import "@/packages/main.css";

.appstore {
  padding: 20px;
}
</style>