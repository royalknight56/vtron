<template>
  <div class="create-url">
    <div class="create-url__header">
      <div class="create-url__title">
        <i class="iconfont icon-link"></i>
        创建网络链接
      </div>
      <div class="create-url__subtitle">在桌面创建网站快捷方式</div>
    </div>
    <div class="create-url__content">
      <div class="create-url__form-item">
        <label for="linki" class="create-url__label">网站链接</label>
        <input
          id="linki"
          v-model="link"
          class="create-url__input"
          :class="{ 'create-url__input--error': showError && !isValidUrl }"
          placeholder="例如: https://www.example.com"
        />
        <span class="create-url__error-text" v-if="showError && !isValidUrl">请输入有效的网址</span>
      </div>
      <div class="create-url__form-item">
        <label for="namei" class="create-url__label">网站名称</label>
        <input
          id="namei"
          v-model="name"
          class="create-url__input"
          :class="{ 'create-url__input--error': showError && !name }"
          placeholder="例如: 我的网站"
        />
        <span class="create-url__error-text" v-if="showError && !name">请输入网站名称</span>
      </div>
    </div>
    <div class="create-url__footer">
      <WinButtonVue @click="create" :disabled="!isValid">创建快捷方式</WinButtonVue>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BrowserWindow, Dialog, System, WinButtonVue, join } from 'vtron';
import { inject, ref, computed } from 'vue';
const link = ref('');
const name = ref('');
const sys = inject<System>('system');
const win = inject<BrowserWindow>('browserWindow');
const showError = ref(false);

const isValidUrl = computed(() => {
  try {
    new URL(link.value);
    return true;
  } catch {
    return false;
  }
});

const isValid = computed(() => {
  return isValidUrl.value && name.value.trim() !== '';
});

function create() {
  showError.value = true;
  if (!isValid.value) return;

  sys?.fs
    .writeFile(
      join(sys._options.userLocation || '', 'Desktop', name.value + '.url'),
      `link::url::${link.value}::${link.value + '/favicon.ico'}`
    )
    .then(async () => {
      await Dialog.showMessageBox({
        message: '创建成功',
        type: 'info',
        title: '提示',
      });
      win?.close();
    });
}
</script>

<style scoped>
.create-url {
  padding: 16px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100%;
  max-width: 360px;
  gap: 16px;
  box-sizing: border-box;
  overflow-y: auto;
}

.create-url__header {
  text-align: center;
}

.create-url__title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.create-url__title .iconfont {
  font-size: 18px;
  color: #409eff;
}

.create-url__subtitle {
  font-size: 12px;
  color: #606266;
}

.create-url__content {
  width: 100%;
  box-sizing: border-box;
}

.create-url__form-item {
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
}

.create-url__label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.create-url__input {
  width: 100%;
  height: 32px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  padding: 0 10px;
  transition: all 0.2s;
  font-size: 12px;
  background: #f5f7fa;
  box-sizing: border-box;
}

.create-url__input:hover {
  border-color: #c0c4cc;
}

.create-url__input:focus {
  border-color: #409eff;
  outline: none;
  background: #fff;
}

.create-url__input--error {
  border-color: #f56c6c;
  background: #fff;
}

.create-url__error-text {
  color: #f56c6c;
  font-size: 11px;
  margin-top: 4px;
  display: block;
}

.create-url__footer {
  display: flex;
  justify-content: center;
}

:deep(.win-button) {
  min-width: 90px;
  height: 32px;
  font-size: 12px;
}

:deep(.win-button:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
