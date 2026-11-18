<template>
  <OnlineAccountAuth v-if="authMode" :initial-mode="authMode" @close="closeAuth" />

  <section v-else class="account-settings">
    <aside class="account-sidebar">
      <h2>账户</h2>
      <nav aria-label="账户设置">
        <button type="button" :aria-current="section === 'info' ? 'page' : undefined" @click="openSection('info')">
          <span class="SEGOEUIMDL" aria-hidden="true">&#xE77B;</span>
          你的信息
        </button>
        <button type="button" :aria-current="section === 'sign-in' ? 'page' : undefined" @click="openSection('sign-in')">
          <span class="SEGOEUIMDL" aria-hidden="true">&#xE8D7;</span>
          登录选项
        </button>
      </nav>
    </aside>

    <div class="account-content">
      <template v-if="section === 'info'">
        <h1>你的信息</h1>
        <div class="account-avatar">
          <img v-if="avatar" :src="avatar" alt="账户头像" />
          <span v-else class="SEGOEUIMDL" aria-hidden="true">&#xE77B;</span>
        </div>

        <div v-if="account">
          <p class="account-name">{{ account.username }}</p>
          <p class="account-kind">Vtron 账户</p>

          <section class="account-group">
            <h2>账户头像</h2>
            <p>头像保存在当前浏览器。</p>
            <div class="account-actions">
              <input ref="avatarInput" type="file" accept="image/png,image/jpeg,image/webp" hidden @change="chooseAvatar" />
              <button type="button" class="account-link icon-action" :disabled="avatarBusy" @click="avatarInput?.click()">
                <span class="SEGOEUIMDL" aria-hidden="true">&#xE8E5;</span>
                浏览文件
              </button>
              <button v-if="avatar" type="button" class="account-link" :disabled="avatarBusy" @click="removeAvatar">
                恢复默认头像
              </button>
            </div>
            <p v-if="avatarError" class="account-error" role="alert">{{ avatarError }}</p>
          </section>
        </div>

        <template v-else>
          <p class="account-name">访客</p>
          <p v-if="!accountLoaded && accountBusy" class="account-kind" role="status">正在检查登录状态…</p>
          <div v-else class="account-actions">
            <button type="button" class="account-link" @click="openAuth('login')">使用 Vtron 账户登录</button>
            <button type="button" class="account-link" @click="openAuth('register')">创建账户</button>
          </div>
        </template>
      </template>

      <template v-else>
        <h1>登录选项</h1>
        <section class="account-group session-group">
          <h2>当前会话</h2>
          <template v-if="account">
            <p>已在此浏览器登录为 <strong>{{ account.username }}</strong>。</p>
            <WinButton type="button" :disabled="accountBusy" @click="updateAccount('logout')">退出登录</WinButton>
          </template>
          <template v-else>
            <p>尚未登录 Vtron 账户。</p>
            <button type="button" class="account-link" @click="openAuth('login')">登录</button>
          </template>
        </section>

        <section v-if="account" class="account-group">
          <h2>删除在线账户</h2>
          <p>删除账户会结束所有登录会话，本地文件会保留。</p>
          <WinButton v-if="!confirmDelete" type="button" :disabled="accountBusy" @click="confirmDelete = true">
            删除账户
          </WinButton>
          <form v-else class="delete-form" @submit.prevent="deleteAccount">
            <input type="hidden" name="username" :value="account.username" autocomplete="username" />
            <label>
              当前密码
              <input v-model="password" type="password" name="password" autocomplete="current-password" required maxlength="128" />
            </label>
            <div class="account-actions">
              <WinButton type="submit" :disabled="accountBusy">确认删除</WinButton>
              <button type="button" class="account-link" :disabled="accountBusy" @click="cancelDelete">取消</button>
            </div>
          </form>
        </section>

        <section v-if="hasLocalLock" class="account-group">
          <h2>本地锁屏</h2>
          <p>此浏览器启用了旧版锁屏。</p>
          <WinButton type="button" @click="removeLocalLock">关闭本地锁屏</WinButton>
        </section>
      </template>
      <p v-if="accountError" class="account-error" role="alert">{{ accountError }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Dialog } from 'vtron';
import WinButton from '@packages/components/WinButton.vue';
import OnlineAccountAuth from './OnlineAccountAuth.vue';
import { account, accountBusy, accountError, accountLoaded, updateAccount } from '../onlineAccount';

const section = ref<'info' | 'sign-in'>('info');
const authMode = ref<'login' | 'register'>();
const confirmDelete = ref(false);
const password = ref('');
const hasLocalLock = ref(Boolean(localStorage.getItem('vtron-username')));
const avatar = ref('');
const avatarInput = ref<HTMLInputElement>();
const avatarBusy = ref(false);
const avatarError = ref('');

onMounted(() => { void updateAccount(); });

function avatarKey(username: string) {
  return `vtron-online-avatar:${username}`;
}

watch(() => account.value?.username, (username) => {
  avatar.value = username ? localStorage.getItem(avatarKey(username)) ?? '' : '';
  avatarError.value = '';
  confirmDelete.value = false;
  password.value = '';
}, { immediate: true });

function openSection(next: typeof section.value) {
  if (section.value === next) return;
  cancelDelete();
  section.value = next;
}

function openAuth(mode: 'login' | 'register') {
  if (accountLoaded.value) accountError.value = '';
  authMode.value = mode;
}

function closeAuth() {
  authMode.value = undefined;
  if (account.value) section.value = 'info';
}

function cancelDelete() {
  confirmDelete.value = false;
  password.value = '';
  if (accountLoaded.value) accountError.value = '';
}

async function deleteAccount() {
  const username = account.value?.username;
  if (!username) return;
  const credentials = { username, password: password.value };
  password.value = '';
  if (await updateAccount('delete', credentials)) {
    localStorage.removeItem(avatarKey(username));
    section.value = 'info';
  }
}

async function removeLocalLock() {
  const result = await Dialog.showMessageBox({
    title: '关闭本地锁屏',
    message: '关闭后，此浏览器打开 Vtron 时会直接进入桌面。',
    type: 'warning',
    buttons: ['关闭锁屏', '取消'],
  });
  if (result.response !== 0) return;
  localStorage.removeItem('vtron-username');
  localStorage.removeItem('vtron-password');
  hasLocalLock.value = false;
}

async function chooseAvatar(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  const username = account.value?.username;
  if (!file || !username || avatarBusy.value) return;

  avatarError.value = '';
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
    avatarError.value = '请选择不超过 8 MB 的 PNG、JPEG 或 WebP 图片。';
    return;
  }

  avatarBusy.value = true;
  try {
    const image = await createImageBitmap(file);
    try {
      if (account.value?.username !== username) return;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 256;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('无法创建头像画布');
      const size = Math.min(image.width, image.height);
      context.drawImage(image, (image.width - size) / 2, (image.height - size) / 2, size, size, 0, 0, 256, 256);
      const url = canvas.toDataURL('image/webp', 0.85);
      localStorage.setItem(avatarKey(username), url);
      avatar.value = url;
    } finally {
      image.close();
    }
  } catch {
    avatarError.value = '无法保存头像，请换一张图片重试。';
  } finally {
    avatarBusy.value = false;
  }
}

function removeAvatar() {
  if (!account.value) return;
  localStorage.removeItem(avatarKey(account.value.username));
  avatar.value = '';
  avatarError.value = '';
}
</script>

<style scoped>
.account-settings {
  display: grid;
  grid-template-columns: var(--settings-sidebar-width) minmax(0, 1fr);
  height: calc(100% - 40px);
  background: #fff;
  color: #1a1a1a;
  font-family: 'Segoe UI', 'Microsoft YaHei', system-ui, sans-serif;
  font-size: 14px;
}

.account-sidebar {
  overflow: auto;
  padding: 22px 0;
  background: #f2f2f2;
}
.account-sidebar h2 {
  margin: 0 16px 14px;
  font-size: 15px;
  font-weight: 600;
}
.account-sidebar button {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 8px 16px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  font: inherit;
  cursor: pointer;
}
.account-sidebar button:hover { background: #e6e6e6; }
.account-sidebar button[aria-current='page']::before {
  position: absolute;
  inset: 11px auto 11px 0;
  width: 3px;
  background: #0067b8;
  content: '';
}

.account-content {
  overflow: auto;
  padding: 20px clamp(16px, 3vw, 28px) 28px;
}
.account-content h1 {
  margin: 0 0 18px;
  font-size: 28px;
  font-weight: 400;
  line-height: 1.2;
}
.account-avatar {
  display: grid;
  place-items: center;
  width: 144px;
  max-width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 50%;
  background: #dedede;
  color: #5d5d5d;
  font-size: 64px;
}
.account-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.account-name {
  margin: 16px 0 4px;
  overflow-wrap: anywhere;
  font-size: 20px;
  font-weight: 600;
}
.account-kind { margin: 0; color: #535353; }
.account-group { margin-top: 28px; }
.session-group { margin-top: 0; }
.account-group h2 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 400;
}
.account-group p { margin: 0 0 10px; overflow-wrap: anywhere; }
.account-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;
}
.account-link {
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: #005a9e;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.account-link:hover:not(:disabled) { text-decoration: underline; }
.account-link:disabled { opacity: 0.55; cursor: default; }
.icon-action { display: inline-flex; align-items: center; gap: 8px; }
.account-link:focus-visible, .account-sidebar button:focus-visible {
  outline: 2px solid #0067b8;
  outline-offset: -2px;
}
.delete-form { display: grid; gap: 10px; max-width: 300px; }
.delete-form label { display: grid; gap: 4px; }
.delete-form input:not([type='hidden']) {
  box-sizing: border-box;
  width: 100%;
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid #757575;
  font: inherit;
}
.account-error { margin: 12px 0 0; color: #a4262c; }
</style>
