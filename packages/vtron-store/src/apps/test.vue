<template>
  设置webdav路径
  <input type="text" v-model="webdavPath" />
  <input v-model="webdavUsername" />
  <input v-model="webdavPassword" />
  <button @click="click">确定</button>
</template>
<script setup lang="ts">
import { inject, ref } from "vue";
const webdavPath = ref("");
const webdavUsername = ref("");
const webdavPassword = ref("");
const browserWindow = inject("browserWindow")!;
const sys = inject<any>("system")!;
console.log(browserWindow, sys);
function click() {
  localStorage.setItem("webdav_path", webdavPath.value);
  localStorage.setItem("webdav_username", webdavUsername.value);
  localStorage.setItem("webdav_password", webdavPassword.value);
}
</script>
