<template>
  <section class="account-settings">
    <h1>在线账户</h1>
    <div v-if="!accountLoaded" aria-live="polite">
      <p v-if="accountBusy">正在连接账户服务…</p>
      <WinButton v-else @click="updateAccount()">重试</WinButton>
    </div>

    <template v-else-if="account">
      <div class="account-profile">
        <img :src="accountIcon" alt="" />
        <strong>{{ account.username }}</strong>
      </div>
      <template v-if="mode !== 'delete'">
        <p>本地文件保存在当前浏览器。</p>
        <div class="actions">
          <WinButton :disabled="accountBusy" @click="logout">退出登录</WinButton>
          <button type="button" class="text-button" :disabled="accountBusy" @click="setMode('delete')">删除在线账户</button>
        </div>
      </template>
      <form v-else class="account-form" @submit.prevent="submit">
        <p>删除后无法再使用此账户登录。本地文件会保留。</p>
        <input type="hidden" name="username" :value="account.username" autocomplete="username" />
        <label>当前密码
          <input v-model="password" type="password" name="password" autocomplete="current-password" required maxlength="128" />
        </label>
        <div class="actions">
          <WinButton type="submit" :disabled="accountBusy">确认删除</WinButton>
          <button type="button" class="text-button" :disabled="accountBusy" @click="setMode('login')">取消</button>
        </div>
      </form>
    </template>

    <form v-else class="account-form" @submit.prevent="submit">
      <label>用户名
        <input
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
      <p v-if="mode === 'register'" class="field-note">3–32 个字母、数字、下划线或连字符，首位用字母或数字。</p>
      <label>密码
        <input
          :key="mode"
          v-model="password"
          type="password"
          name="password"
          :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
          :minlength="mode === 'register' ? 15 : undefined"
          maxlength="128"
          required
        />
      </label>
      <p v-if="mode === 'register'" class="field-note">至少 15 个字符。请妥善保管密码，暂不支持找回。</p>
      <div class="actions">
        <WinButton type="submit" :disabled="accountBusy">{{ mode === 'register' ? '注册' : '登录' }}</WinButton>
        <button type="button" class="text-button" :disabled="accountBusy" @click="setMode(mode === 'register' ? 'login' : 'register')">
          {{ mode === 'register' ? '返回登录' : '创建账户' }}
        </button>
      </div>
    </form>
    <p v-if="accountError" role="alert" class="error">{{ accountError }}</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import WinButton from '@packages/components/WinButton.vue';
import accountIcon from '@/assets/icon/e77b.png';
import { account, accountBusy, accountError, accountLoaded, updateAccount } from '../onlineAccount';

const mode = ref<'login' | 'register' | 'delete'>('login');
const username = ref('');
const password = ref('');

onMounted(() => { void updateAccount(); });

function setMode(next: typeof mode.value) {
  mode.value = next;
  password.value = '';
  accountError.value = '';
}

async function submit() {
  const action = mode.value;
  const credentials = { username: action === 'delete' ? (account.value?.username ?? '') : username.value, password: password.value };
  password.value = '';
  if (await updateAccount(action, credentials)) setMode('login');
}

async function logout() {
  if (await updateAccount('logout')) {
    username.value = '';
    setMode('login');
  }
}
</script>

<style scoped>
.account-settings {
  box-sizing: border-box;
  height: calc(100% - 40px);
  overflow: auto;
  padding: 16px clamp(16px, 4vw, 32px) 24px;
  color: #1a1a1a;
}
.account-settings h1 { margin: 0 0 20px; font-size: 24px; font-weight: 400; }
.account-settings p { margin: 12px 0; }
.account-profile { display: flex; align-items: center; gap: 12px; overflow-wrap: anywhere; }
.account-profile img { width: 36px; height: 36px; object-fit: contain; }
.account-form { display: grid; gap: 12px; max-width: 340px; }
.account-form label { display: grid; gap: 4px; }
.account-form input:not([type='hidden']) {
  box-sizing: border-box;
  width: 100%;
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid #757575;
  border-radius: 0;
  font: inherit;
}
.account-form input:focus { outline: 2px solid #0067b8; outline-offset: -2px; }
.account-form .field-note { margin: -6px 0 0; color: #555; font-size: 13px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; }
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
.account-settings .error { color: #a4262c; }
</style>
