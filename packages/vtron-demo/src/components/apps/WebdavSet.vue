<template>
  <div class="set">
    <div class="set-title">设置webdav</div>

    <div class="set-item">
      <div class="label">开启webdav：</div>
      <div class="content">
        <WinSelect
          v-model="isEnableWebdav"
          :options="[
            {
              label: '关闭',
              value: 0,
            },
            {
              label: '开启',
              value: 1,
            },
          ]"
          :placeholder="'please.select'"
        />
      </div>
    </div>
    <template v-if="isEnableWebdav === 1">
      <div class="set-item">
        <div class="label">Url：</div>
        <div class="content">
          <WinInput type="text" v-model="webdavUrl" />
        </div>
      </div>
      <div class="set-item">
        <div class="label">用户名：</div>
        <div class="content">
          <WinInput v-model="webdavUsername" />
        </div>
      </div>
      <div class="set-item">
        <div class="label">密码：</div>
        <div class="content">
          <WinInput v-model="webdavPassword" />
        </div>
      </div>

      <div class="set-item">
        <div class="label">挂载路径：</div>
        <div class="content">
          <WinInput v-model="webdavPath" />
        </div>
      </div>
    </template>

    <div class="set-item">
      <div class="label"></div>
      <div class="content">
        <WinButtonVue v-show="!loading" @click="click">确定</WinButtonVue>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Dialog, WinButtonVue, WinInput, WinSelect } from "vtron";
import { inject, ref } from "vue";
import { AuthType, FileStat, createClient } from "webdav";

const webdavUrl = ref(localStorage.getItem("webdav_url") || "");
const webdavPath = ref(localStorage.getItem("webdav_path") || "");
const webdavUsername = ref(localStorage.getItem("webdav_username") || "");
const webdavPassword = ref(localStorage.getItem("webdav_password") || "");

const loading = ref(false);

const isEnableWebdav = ref(1);

function click() {
  loading.value = true;
  if (isEnableWebdav.value === 0) {
    localStorage.setItem("webdav_url", "");
    localStorage.setItem("webdav_path", "");
    localStorage.setItem("webdav_username", "");
    localStorage.setItem("webdav_password", "");
    loading.value = false;
    Dialog.showMessageBox({
      type: "info",
      title: "提示",
      message: "设置成功,请重新启动",
    });
    return;
  }
  if (
    !webdavUrl.value ||
    !webdavPath.value ||
    !webdavUsername.value ||
    !webdavPassword.value
  ) {
    loading.value = false;
    Dialog.showMessageBox({
      type: "error",
      title: "提示",
      message: "请填写完整",
    });
    return;
  }
  const client = createClient(webdavUrl.value, {
    // authType: AuthType.Digest,
    username: webdavUsername.value,
    password: webdavPassword.value,
  });
  client
    .stat(webdavPath.value)
    .then((stattemp) => {
      let stat = stattemp as FileStat;
      if (stat?.type !== "directory") {
        Dialog.showMessageBox({
          type: "error",
          title: "提示",
          message: "挂载路径不是文件夹",
        });
        loading.value = false;
        return;
      }
      localStorage.setItem("webdav_url", webdavUrl.value || "");
      localStorage.setItem("webdav_path", webdavPath.value || "");
      localStorage.setItem("webdav_username", webdavUsername.value || "");
      localStorage.setItem("webdav_password", webdavPassword.value || "");
      loading.value = false;
      Dialog.showMessageBox({
        type: "info",
        title: "提示",
        message: "设置成功,请重新启动",
      });
    })
    .catch((err) => {
      loading.value = false;

      Dialog.showMessageBox({
        type: "error",
        title: "提示",
        message: "webdav连接失败，请重试",
      });
    });
}
</script>
<style scoped>
.set {
  position: relative;
  left: 300px;
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.set-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 40px;
}
.set-item {
  display: flex;
  flex-direction: row;
  gap: 10px;
}
.label {
  width: 100px;
  font-size: 14px;
  text-align: right;
}
.content {
  flex: 1;
}
</style>
