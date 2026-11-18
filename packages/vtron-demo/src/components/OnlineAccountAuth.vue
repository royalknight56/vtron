<template>
  <section class="auth-page">
    <div class="auth-card">
      <div class="auth-brand">
        <img :src="vtronLogo" alt="" />
        <span>Vtron</span>
      </div>
      <h1>{{ mode === 'register' ? '创建账户' : '登录' }}</h1>

      <div v-if="!accountLoaded" class="auth-status" aria-live="polite">
        <p v-if="accountBusy">正在连接账户服务…</p>
        <template v-else>
          <p v-if="accountError" class="error" role="alert">{{ accountError }}</p>
          <button type="button" class="auth-primary" @click="updateAccount()">重试</button>
        </template>
      </div>

      <template v-else>
        <form class="auth-form" :aria-busy="accountBusy" @submit.prevent="submit">
          <div>
            <label class="auth-field">
              <span>用户名</span>
              <input
                ref="usernameInput"
                v-model.trim="username"
                name="username"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                pattern="[a-zA-Z0-9][a-zA-Z0-9_\-]{2,31}"
                maxlength="32"
                required
              />
            </label>
            <p v-if="mode === 'register'" class="field-note">3–32 位，可用字母、数字、下划线和连字符，首位用字母或数字。</p>
          </div>

          <div>
            <div class="auth-password">
              <label class="auth-field">
                <span>密码</span>
                <input
                  :key="mode"
                  v-model="password"
                  :type="passwordVisible ? 'text' : 'password'"
                  name="password"
                  :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
                  :minlength="mode === 'register' ? minPasswordLength : undefined"
                  maxlength="128"
                  required
                />
              </label>
              <button
                type="button"
                class="password-toggle"
                :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
                :disabled="accountBusy"
                @click="passwordVisible = !passwordVisible"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                  <circle cx="12" cy="12" r="2.5" />
                  <path v-if="passwordVisible" d="m4 4 16 16" />
                </svg>
              </button>
            </div>
            <p v-if="mode === 'register'" class="field-note">至少 {{ minPasswordLength }} 个字符，暂不支持找回密码。</p>
          </div>

          <p v-if="accountError" role="alert" class="error">{{ accountError }}</p>
          <button class="auth-primary" type="submit" :disabled="accountBusy">
            {{ mode === 'register' ? '创建账户' : '登录' }}
          </button>
        </form>

        <div class="auth-switch">
          <span>{{ mode === 'register' ? '已有账户？' : '没有账户？' }}</span>
          <button
            type="button"
            class="text-button"
            :disabled="accountBusy"
            @click="switchAuthMode"
          >
            {{ mode === 'register' ? '返回登录' : '创建账户' }}
          </button>
        </div>
      </template>
      <button type="button" class="text-button auth-back" :disabled="accountBusy" @click="$emit('close')">
        返回账户设置
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import vtronLogo from '../assets/vtron-icon-nobg.png';
import { accountBusy, accountError, accountLoaded, updateAccount } from '../onlineAccount';

const props = defineProps<{ initialMode: 'login' | 'register' }>();
const emit = defineEmits<{ close: [] }>();
const minPasswordLength = 8;
const mode = ref(props.initialMode);
const username = ref('');
const password = ref('');
const passwordVisible = ref(false);
const usernameInput = ref<HTMLInputElement>();

async function switchAuthMode() {
  mode.value = mode.value === 'register' ? 'login' : 'register';
  password.value = '';
  passwordVisible.value = false;
  accountError.value = '';
  await nextTick();
  usernameInput.value?.focus();
}

async function submit() {
  const credentials = { username: username.value, password: password.value };
  password.value = '';
  passwordVisible.value = false;
  if (await updateAccount(mode.value, credentials)) emit('close');
}
</script>

<style scoped>
.auth-page {
  display: flex;
  box-sizing: border-box;
  height: calc(100% - 40px);
  overflow: auto;
  color: #1a1a1a;
  padding: 20px clamp(12px, 4vw, 32px);
  background: radial-gradient(ellipse at 15% 0%, #e3edf9, transparent 65%), #f2f4f7;
  font-family: 'Segoe UI', 'Microsoft YaHei', system-ui, sans-serif;
}
.auth-card {
  box-sizing: border-box;
  width: min(100%, 440px);
  margin: auto;
  padding: clamp(20px, 5vw, 36px);
  border: 1px solid #dce1e8;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 5px 22px rgb(30 46 73 / 10%);
}
.auth-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-bottom: 14px;
  font-size: 20px;
  font-weight: 600;
}
.auth-brand img { display: block; width: 32px; height: 32px; }
.auth-card h1 { margin: 0 0 28px; font-size: 24px; text-align: center; font-weight: 600; }
.auth-form { display: grid; gap: 18px; }
.auth-field { position: relative; display: block; }
.auth-field span {
  position: absolute;
  top: 0;
  left: 10px;
  transform: translateY(-50%);
  padding: 0 4px;
  background: #fff;
  color: #4e535a;
  font-size: 12px;
  line-height: 16px;
}
.auth-field input {
  box-sizing: border-box;
  width: 100%;
  height: 44px;
  padding: 0 13px;
  border: 1px solid #80858d;
  border-radius: 4px;
  background: #fff;
  color: inherit;
  font: inherit;
}
.auth-field input:focus {
  border-color: #0067b8;
  outline: 1px solid #0067b8;
  outline-offset: -1px;
  box-shadow: inset 0 -2px #0067b8;
}
.auth-field:focus-within span { color: #005a9e; }
.auth-password { position: relative; }
.auth-password input { padding-right: 44px; }
.auth-password input::-ms-reveal { display: none; }
.password-toggle {
  position: absolute;
  top: 4px;
  right: 4px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: #4e535a;
  cursor: pointer;
}
.password-toggle:hover:not(:disabled) { background: #eef1f4; }
.auth-card .field-note { margin: 6px 0 0; color: #555c64; font-size: 12px; line-height: 1.5; }
.auth-card .error { margin: 0; font-size: 13px; line-height: 1.5; }
.auth-primary {
  width: 100%;
  min-height: 40px;
  padding: 7px 16px;
  border: 0;
  border-radius: 4px;
  background: #0067b8;
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.auth-primary:hover:not(:disabled) { background: #00599f; }
.auth-primary:disabled { background: #e3e8ee; color: #585d63; cursor: default; }
.auth-card button:focus-visible { outline: 2px solid #0067b8; outline-offset: 2px; }
.auth-switch {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: baseline;
  gap: 4px;
  margin-top: 18px;
  color: #4e535a;
  font-size: 14px;
}
.auth-switch button { font-weight: 600; }
.auth-status { display: grid; gap: 14px; text-align: center; }
.auth-status p { margin: 0; }
.text-button {
  background: none;
  border: 0;
  padding: 4px 0;
  color: #005a9e;
  font: inherit;
  cursor: pointer;
}
.text-button:hover { text-decoration: underline; }
.text-button:disabled { opacity: 0.55; cursor: default; }
.auth-card .error { color: #a4262c; }
.auth-back { display: block; margin: 12px auto 0; font-size: 14px; }
</style>
