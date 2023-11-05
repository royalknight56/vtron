<template>
  <div class="comment" v-if="state === 'ready'">
    <div class="tip">请输入您的意见</div>
    <div class="alr">
      在这里提意见之前，可以首先转到github提供issue，可以得到及时的跟踪反馈
      <a
        target="_blank"
        href="https://github.com/royalknight56/vtron/issues/new"
      >
        https://github.com/royalknight56/vtron/issues/new
      </a>
    </div>
    <div class="user">
      <span class="user-label">您的昵称或联系方式：</span>
      <input type="text" v-model="user" />
    </div>
    <textarea class="comment-text" v-model="comment"></textarea>
    <WinButtonVue @click="submit">submit</WinButtonVue>
  </div>
  <div class="comment-loading" v-if="state === 'loading'"></div>
</template>
<script setup lang="ts">
import { inject, ref } from "vue";
import { Dialog, BrowserWindow, WinButtonVue } from "vtron";
const comment = ref("");
const user = ref("");
const state = ref("ready");
let browserWindow = <BrowserWindow>inject("browserWindow");

function submit() {
  if (!user.value || !comment.value) {
    Dialog.showMessageBox({
      type: "error",
      message: "请填写昵称或联系方式以及您的意见！",
    });
    return;
  }
  state.value = "loading";

  fetch("https://myim.online:3100/api/comment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user: user.value,
      comment: comment.value,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      state.value = "success";
      Dialog.showMessageBox({
        type: "info",
        message: "感谢您的意见！我们已经收到了您的反馈，我们会尽快处理！",
      }).finally(() => {
        browserWindow.close();
      });
    });
}
</script>

<style scoped>
.comment {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.comment-text {
  width: 300px;
  height: 100px;
  resize: none;
}
.comment-loading {
  width: 100%;
  height: 100%;
  background-color: #0000001a;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.win-button {
  background-color: #f0f0f0;
  border: 1px solid #00000028;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  width: 80px;
  height: 26px;
  border-width: 1px;
  box-sizing: border-box;
}

.win-button:hover {
  border-width: 2px;
  border-color: #0078d7;
  background-color: #e5f1fb;
}
.alr {
  font-size: 12px;
  color: #0000008a;
  text-align: center;
  width: 300px;
  line-height: 20px;
}

.user {
}

.user-label {
  font-size: 14px;
}
</style>
