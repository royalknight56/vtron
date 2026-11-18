<template>
  <SettingsPanel :title="titles[category][0]" :pages="[titles[category][1]]">
    <template v-if="category === 'accessibility'">
      <h2>视觉</h2>
      <SettingAppLink name="放大镜">打开放大镜</SettingAppLink>
      <h2>交互</h2>
      <SettingAppLink name="屏幕键盘">打开屏幕键盘</SettingAppLink>
    </template>
    <template v-else-if="category === 'devices'">
      <button class="action" type="button" @click="readDevices">刷新设备</button>
      <div class="device-status" aria-live="polite">
        <p v-if="devices === undefined">正在检测设备…</p>
        <p v-else-if="!devices.length">浏览器没有提供可列出的设备。</p>
        <ul v-else class="device-list">
          <li v-for="(device, index) in devices" :key="index">
            <span>{{ device.label || deviceKinds[device.kind] }}</span>
            <small v-if="device.label">{{ deviceKinds[device.kind] }}</small>
          </li>
        </ul>
      </div>
      <h2>相关设置</h2>
      <SettingAppLink name="设备管理器" />
      <SettingAppLink name="相机" location="Desktop">打开相机</SettingAppLink>
    </template>
    <template v-else-if="category === 'network'">
      <div class="connection">
        <span class="SEGOEUIMDL" aria-hidden="true">&#xE774;</span>
        <div>
          <strong>{{ online ? '浏览器在线' : '浏览器离线' }}</strong>
          <p>{{ origin }}</p>
        </div>
      </div>
      <SettingAppLink name="Chrome" location="Desktop">打开浏览器</SettingAppLink>
    </template>
    <template v-else-if="category === 'privacy'">
      <p>可在浏览器的站点设置中修改权限。</p>
      <dl class="permissions">
        <div v-for="item in permissionLabels" :key="item.name">
          <dt>{{ item.label }}</dt>
          <dd>{{ permissions[item.name] ?? '正在读取…' }}</dd>
        </div>
      </dl>
      <button class="action" type="button" @click="readPermissions">刷新权限</button>
    </template>
    <template v-else-if="category === 'search'">
      <form @submit.prevent="searchFiles">
        <label class="field">
          <span>文件或文件夹名称的开头</span>
          <input v-model.trim="keyword" type="search" placeholder="例如：使用教程" />
        </label>
        <button class="action" type="submit" :disabled="!keyword || busy">搜索</button>
      </form>
      <p role="status">{{ searchStatus }}</p>
      <ul v-if="results.length" class="search-results">
        <li v-for="result in results" :key="result.path">
          <button type="button" class="settings-link" @click="openResult(result.path)">
            {{ result.name }}
          </button>
          <small>{{ result.path }}</small>
        </li>
      </ul>
    </template>
    <template v-else-if="category === 'gaming'">
      <button class="action" type="button" :disabled="!fullscreenAvailable" @click="toggleFullscreen">
        {{ fullscreen ? '退出全屏' : '全屏显示 Vtron' }}
      </button>
      <p v-if="!fullscreenAvailable">当前浏览器未提供全屏功能。</p>
      <p v-if="fullscreenError" role="status">{{ fullscreenError }}</p>
    </template>
    <template v-else>
      <p>在手机浏览器中打开 Vtron。文件保存在各自的设备上。</p>
      <label class="field">
        <span>访问链接</span>
        <input type="url" readonly :value="mobileUrl" @focus="($event.target as HTMLInputElement).select()" />
      </label>
      <button v-if="canCopy" class="action" type="button" @click="copyLink">复制链接</button>
      <p v-if="copyStatus" role="status">{{ copyStatus }}</p>
    </template>
  </SettingsPanel>
</template>

<script lang="ts">
export type WebSettingsCategory =
  | 'accessibility'
  | 'devices'
  | 'network'
  | 'privacy'
  | 'search'
  | 'gaming'
  | 'phone';
</script>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import type { VtronFileWithoutContent } from '@/packages/kernel/file/FileSystem';
import SettingsPanel from './SettingsPanel.vue';
import SettingAppLink from './SettingAppLink.vue';
import { useDesktopPreferences } from './preferences';

const { category } = defineProps<{ category: WebSettingsCategory }>();
const { system } = useDesktopPreferences();
const titles = {
  accessibility: ['轻松使用', '辅助工具'],
  devices: ['设备', '音频和视频设备'],
  network: ['网络和 Internet', '网络状态'],
  privacy: ['隐私', '站点权限'],
  search: ['搜索', '搜索文件'],
  gaming: ['游戏', '游戏显示'],
  phone: ['手机', '在手机上使用 Vtron'],
};
const deviceKinds: Record<MediaDeviceKind, string> = {
  audioinput: '麦克风',
  audiooutput: '扬声器',
  videoinput: '摄像头',
};
const devices = ref<MediaDeviceInfo[]>();
const online = ref(navigator.onLine);
const origin = location.origin;
const permissionLabels = [
  { name: 'camera', label: '相机' },
  { name: 'microphone', label: '麦克风' },
  { name: 'notifications', label: '浏览器通知' },
  { name: 'geolocation', label: '位置' },
] as const;
const permissionStates: Record<PermissionState, string> = {
  granted: '已允许',
  denied: '已阻止',
  prompt: '使用时询问',
};
const permissions = ref<Partial<Record<(typeof permissionLabels)[number]['name'], string>>>({});
const keyword = ref('');
const results = ref<VtronFileWithoutContent[]>([]);
const busy = ref(false);
const searchStatus = ref('');
const fullscreenAvailable = Boolean(document.fullscreenEnabled && system.rootRef?.requestFullscreen);
const fullscreen = ref(document.fullscreenElement === system.rootRef);
const fullscreenError = ref('');
const mobileUrl = system.getConfig('mobileDemoUrl') || location.origin + location.pathname;
const canCopy = Boolean(navigator.clipboard?.writeText);
const copyStatus = ref('');

async function readDevices() {
  try {
    devices.value = (await navigator.mediaDevices?.enumerateDevices()) ?? [];
  } catch {
    devices.value = [];
  }
}

async function readPermissions() {
  const entries = await Promise.all(
    permissionLabels.map(async ({ name }) => {
      try {
        const permission = await navigator.permissions.query({ name: name as PermissionName });
        return [name, permissionStates[permission.state]] as const;
      } catch {
        return [name, '浏览器未提供状态'] as const;
      }
    })
  );
  permissions.value = Object.fromEntries(entries);
}

async function searchFiles() {
  if (!keyword.value || busy.value) return;
  busy.value = true;
  results.value = [];
  searchStatus.value = '正在搜索…';
  try {
    const matches = await system.fs.search(keyword.value);
    results.value = matches.slice(0, 50);
    searchStatus.value =
      matches.length > 50
        ? `找到 ${matches.length} 项，显示前 50 项。`
        : matches.length
        ? `找到 ${matches.length} 项。`
        : '没有找到匹配项。';
  } catch {
    searchStatus.value = '搜索失败，请重试。';
  } finally {
    busy.value = false;
  }
}

async function openResult(path: string) {
  try {
    await system.openFile(path);
  } catch {
    searchStatus.value = '无法打开该项目，请重新搜索。';
  }
}

async function toggleFullscreen() {
  fullscreenError.value = '';
  try {
    if (fullscreen.value) await document.exitFullscreen();
    else await system.rootRef?.requestFullscreen();
  } catch {
    fullscreenError.value = '浏览器无法切换全屏。';
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(mobileUrl);
    copyStatus.value = '已复制链接。';
  } catch {
    copyStatus.value = '复制失败，请从上方文本框手动复制。';
  }
}
function updateConnection() {
  online.value = navigator.onLine;
}
function updateFullscreen() {
  fullscreen.value = document.fullscreenElement === system.rootRef;
}

onMounted(() => {
  if (category === 'network') {
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
  }
  if (category === 'devices') readDevices();
  if (category === 'privacy') readPermissions();
  if (category === 'gaming') document.addEventListener('fullscreenchange', updateFullscreen);
});
onUnmounted(() => {
  window.removeEventListener('online', updateConnection);
  window.removeEventListener('offline', updateConnection);
  document.removeEventListener('fullscreenchange', updateFullscreen);
});
</script>

<style scoped>
.connection {
  display: flex;
  align-items: center;
  gap: 16px;
}
.connection > span {
  font-size: 30px;
}
.connection p {
  margin: 4px 0;
  overflow-wrap: anywhere;
}
.device-status {
  min-height: 110px;
  margin-top: 8px;
}
.device-list,
.search-results {
  margin: 0 0 14px;
  padding: 0;
  list-style: none;
}
.device-list li,
.search-results li,
.permissions > div {
  padding: 9px 0;
  border-bottom: 1px solid #e6e6e6;
}
small {
  display: block;
  margin-top: 3px;
  color: #595959;
  overflow-wrap: anywhere;
}
.permissions > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 5px 18px;
}
.permissions dd,
.search-results .settings-link {
  margin: 0;
}
</style>
