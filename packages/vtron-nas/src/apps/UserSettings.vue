<!--
 * @author vtron-nas
 * 用户设置 -- 修改密码
-->
<template>
  <div class="user-settings">
    <h2>用户设置</h2>
    <div class="us-section">
      <h3>修改密码</h3>
      <input v-model="form.oldPassword" type="password" placeholder="当前密码" class="us-input" />
      <input v-model="form.newPassword" type="password" placeholder="新密码" class="us-input" />
      <input v-model="form.confirmPassword" type="password" placeholder="确认新密码" class="us-input" />
      <p v-if="message" :class="['us-msg', success ? 'success' : 'error']">{{ message }}</p>
      <button class="us-btn" @click="handleChangePassword">确认修改</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { changePassword } from '../api/auth';

const form = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });
const message = ref('');
const success = ref(false);

async function handleChangePassword() {
  message.value = '';
  if (!form.value.oldPassword || !form.value.newPassword) {
    message.value = '请填写完整信息';
    success.value = false;
    return;
  }
  if (form.value.newPassword !== form.value.confirmPassword) {
    message.value = '两次输入的新密码不一致';
    success.value = false;
    return;
  }
  try {
    await changePassword(form.value.oldPassword, form.value.newPassword);
    message.value = '密码修改成功';
    success.value = true;
    form.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  } catch (err: any) {
    message.value = err.response?.data?.message || '修改失败';
    success.value = false;
  }
}
</script>

<style scoped>
.user-settings {
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #fff;
  height: 100%;
}
.user-settings h2 { margin: 0 0 20px; font-size: 18px; }
.us-section { max-width: 360px; }
.us-section h3 { margin: 0 0 12px; font-size: 15px; color: #555; }
.us-input {
  display: block;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}
.us-input:focus { border-color: #0078d4; outline: none; }
.us-btn {
  padding: 8px 20px;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  background: #0078d4;
  border: none;
  border-radius: 6px;
}
.us-btn:hover { background: #005a9e; }
.us-msg { font-size: 13px; margin: 8px 0; }
.us-msg.success { color: #27ae60; }
.us-msg.error { color: #e74c3c; }
</style>
