<template>
  <div class="about">
    <div class="about-banner">
      <!-- <img :src="logo" class="about-logo" /> -->
      <div class="about-product">
        <div class="about-product-name">Vtron Desktop</div>
        <div class="about-product-sub">Web Desktop Environment</div>
      </div>
    </div>

    <div class="about-body">
      <div class="about-section">
        <div class="about-section-title">版本信息</div>
        <div class="about-row">
          <span class="about-label">Vtron Plus</span>
          <span class="about-value">v{{ plusVersion }}</span>
        </div>
        <div class="about-row">
          <span class="about-label">Vtron Core</span>
          <span class="about-value">v{{ coreVersion }}</span>
        </div>
        <div class="about-row">
          <span class="about-label">Vue</span>
          <span class="about-value">v{{ vueVersion }}</span>
        </div>
      </div>

      <div class="about-section">
        <div class="about-section-title">系统环境</div>
        <div class="about-row">
          <span class="about-label">浏览器</span>
          <span class="about-value">{{ browserName }}</span>
        </div>
        <div class="about-row">
          <span class="about-label">平台</span>
          <span class="about-value">{{ platform }}</span>
        </div>
        <div class="about-row">
          <span class="about-label">文件系统</span>
          <span class="about-value">{{ fsName }}</span>
        </div>
      </div>

      <div class="about-footer">
        <div class="about-copyright">© {{ year }} Vtron Project</div>
        <div class="about-license">Licensed under MIT</div>
      </div>
    </div>

    <div class="about-actions">
      <button class="about-btn" @click="close">确定</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, ref, onMounted } from 'vue';
import { version as vueVersion } from 'vue';
import { BrowserWindow, System } from 'vtron';
import logo from '../assets/vtron-stroe-icon-nobg.png';
import plusPkg from '../../../package.json?raw';
import corePkg from '../../../../vtron/package.json?raw';

const sys = inject<System>('system');
const win = inject<BrowserWindow>('browserWindow');

const plusVersion = JSON.parse(plusPkg).version;
const coreVersion = JSON.parse(corePkg).version;
const year = new Date().getFullYear();

const browserName = ref('');
const platform = ref('');
const fsName = ref('');

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Microsoft Edge';
  if (ua.includes('Chrome/')) return 'Google Chrome';
  if (ua.includes('Firefox/')) return 'Mozilla Firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Apple Safari';
  return 'Unknown';
}

onMounted(() => {
  browserName.value = detectBrowser();
  platform.value = navigator.platform || 'Unknown';
  fsName.value = sys?.fs?.name || 'VtronFileSystem';
});

function close() {
  win?.close();
}
</script>
<style scoped>
.about {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f3f3f3;
  font-family:
    'Segoe UI',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-size: 12px;
  color: #222;
  user-select: none;
}

.about-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 24px 16px;
  background: linear-gradient(135deg, #1a73e8 0%, #4a90d9 50%, #6db3f2 100%);
  color: #fff;
}

.about-logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25));
}

.about-product-name {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.about-product-sub {
  font-size: 11px;
  opacity: 0.85;
  margin-top: 2px;
}

.about-body {
  flex: 1;
  padding: 12px 24px;
  overflow-y: auto;
}

.about-section {
  margin-bottom: 14px;
}

.about-section-title {
  font-size: 11px;
  font-weight: 600;
  color: #1a73e8;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid #e0e0e0;
}

.about-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.about-label {
  color: #555;
}

.about-value {
  font-weight: 500;
  color: #222;
  font-family: 'Consolas', 'SF Mono', monospace;
  font-size: 11px;
}

.about-footer {
  text-align: center;
  padding-top: 10px;
  border-top: 1px solid #e0e0e0;
  color: #888;
  font-size: 11px;
  line-height: 1.6;
}

.about-copyright {
  font-weight: 500;
  color: #666;
}

.about-actions {
  padding: 10px 24px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #ddd;
  background: #f3f3f3;
  flex-shrink: 0;
}

.about-btn {
  min-width: 80px;
  height: 28px;
  border: 1px solid #bbb;
  border-radius: 3px;
  background: #e1e1e1;
  color: #222;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.about-btn:hover {
  background: #d0d0d0;
  border-color: #999;
}

.about-btn:active {
  background: #c0c0c0;
}
</style>
