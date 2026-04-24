<!--
 * @author vtron-nas
 * 登录页面组件
-->
<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <svg viewBox="0 0 48 48" width="48" height="48">
          <rect x="4" y="8" width="40" height="32" rx="4" fill="#0078d4" />
          <rect x="8" y="14" width="14" height="10" rx="2" fill="#fff" opacity="0.9" />
          <rect x="26" y="14" width="14" height="4" rx="1" fill="#fff" opacity="0.7" />
          <rect x="26" y="22" width="10" height="2" rx="1" fill="#fff" opacity="0.5" />
          <rect x="8" y="28" width="32" height="6" rx="2" fill="#fff" opacity="0.3" />
        </svg>
        <h1>Vtron NAS</h1>
      </div>
      <div class="login-form">
        <input
          v-model="username"
          type="text"
          placeholder="用户名"
          class="login-input"
          @keyup.enter="handleLogin"
        />
        <input
          v-model="password"
          type="password"
          placeholder="密码"
          class="login-input"
          @keyup.enter="handleLogin"
        />
        <p v-if="errorMsg" class="login-error">{{ errorMsg }}</p>
        <button class="login-btn" :disabled="loading" @click="handleLogin">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { login } from '../api/auth';
import { setToken } from '../api/client';

const emit = defineEmits<{ (e: 'loginSuccess', user: any): void }>();

const username = ref('');
const password = ref('');
const errorMsg = ref('');
const loading = ref(false);

async function handleLogin() {
  if (!username.value || !password.value) {
    errorMsg.value = '请输入用户名和密码';
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    const result = await login(username.value, password.value);
    setToken(result.token);
    emit('loginSuccess', result.user);
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 380px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.login-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}
.login-logo h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.login-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.login-input:focus {
  border-color: #0078d4;
}
.login-btn {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  background: #0078d4;
  border: none;
  border-radius: 8px;
  transition: background 0.2s;
}
.login-btn:hover:not(:disabled) {
  background: #005a9e;
}
.login-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.login-error {
  margin: 0;
  font-size: 13px;
  color: #e74c3c;
  text-align: center;
}
</style>
