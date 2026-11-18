<template>
  <SettingsPanel title="系统" :pages="settingPages('system')" v-model="page">
    <template v-if="page === 0">
      <label class="field">
        <span>桌面亮度 {{ brightness }}%</span>
        <input v-model.number="brightness" type="range" min="30" max="100" @change="saveBrightness" />
      </label>
      <h2>显示区域</h2>
      <p>{{ displaySize }}</p>
    </template>
    <template v-else-if="page === 1">
      <label class="field">
        <span>Windows Media Player 音量 {{ volume }}%</span>
        <input v-model.number="volume" type="range" min="0" max="100" @change="save('mediaVolume', volume)" />
      </label>
      <SettingAppLink name="Windows Media Player">打开 Windows Media Player</SettingAppLink>
    </template>
    <template v-else-if="page === 2">
      <label class="field">
        <span>在桌面显示通知横幅</span>
        <input
          type="checkbox"
          role="switch"
          :checked="preferences.showNotifications !== false"
          @change="save('showNotifications', ($event.target as HTMLInputElement).checked)"
        />
      </label>
      <button
        class="action"
        type="button"
        :disabled="preferences.showNotifications === false"
        @click="system.createNotify({ source: '设置', title: '设置', content: '这是一条 Vtron 通知。' })"
      >
        发送测试通知
      </button>
    </template>
    <template v-else-if="page === 3">
      <h2>浏览器存储</h2>
      <template v-if="storage">
        <progress :value="storage.usage" :max="storage.quota" aria-label="浏览器存储使用量" />
        <p>已使用 {{ formatBytes(storage.usage) }}，站点配额约 {{ formatBytes(storage.quota) }}。</p>
      </template>
      <p v-else>{{ storageChecked ? '浏览器未提供存储用量。' : '正在读取存储用量…' }}</p>
      <h2>虚拟磁盘</h2>
      <p v-if="drives.length">{{ drives.join('、') }}</p>
      <SettingAppLink name="磁盘管理" />
      <SettingAppLink name="磁盘清理" />
    </template>
    <template v-else>
      <h2>Vtron 规格</h2>
      <dl class="specs">
        <dt>产品</dt>
        <dd>Vtron WebOS</dd>
        <dt>版本</dt>
        <dd>{{ system.version }}</dd>
        <dt>运行环境</dt>
        <dd>网页浏览器</dd>
      </dl>
      <SettingAppLink name="系统信息">打开系统信息</SettingAppLink>
    </template>
  </SettingsPanel>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { settingPages } from './settingPages';
import SettingsPanel from './SettingsPanel.vue';
import SettingAppLink from './SettingAppLink.vue';
import { useDesktopPreferences } from './preferences';

const { system, preferences, save } = useDesktopPreferences();
const props = defineProps<{ initialPage?: number }>();
const page = ref(props.initialPage ?? 0);
const brightness = ref(system.getConfig('brightness') ?? 100);
watch(() => system.getConfig('brightness'), value => { brightness.value = value ?? 100; });
const volume = ref(preferences.value.mediaVolume ?? 100);
const displaySize = ref('');
const storage = ref<{ usage: number; quota: number }>();
const storageChecked = ref(false);
const drives = ref<string[]>([]);
let observer: ResizeObserver | undefined;

onMounted(() => {
  const root = system.rootRef;
  if (!root) return;
  const updateSize = () => {
    displaySize.value = `${root.clientWidth} × ${root.clientHeight} CSS 像素`;
  };
  updateSize();
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(updateSize);
    observer.observe(root);
  }
});
onUnmounted(() => observer?.disconnect());

watch(page, async (value) => {
  if (value !== 3) return;
  storageChecked.value = false;
  const [estimate, volumes] = await Promise.allSettled([
    navigator.storage?.estimate(),
    system.fs.readdir('/'),
  ]);
  const usage = estimate.status === 'fulfilled' ? estimate.value?.usage : undefined;
  const quota = estimate.status === 'fulfilled' ? estimate.value?.quota : undefined;
  storage.value = usage !== undefined && quota ? { usage, quota } : undefined;
  storageChecked.value = true;
  drives.value =
    volumes.status === 'fulfilled'
      ? volumes.value.filter((file) => file.isDirectory).map((file) => file.path)
      : [];
});

async function saveBrightness() {
  try {
    await system.setConfig('brightness', brightness.value);
  } catch {
    system.createDialog().showMessageBox({ title: '显示', message: '无法保存亮度。', type: 'error' });
  }
}
function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
</script>

<style scoped>
progress {
  width: min(100%, 320px);
  accent-color: #0078d7;
}
.specs {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 9px 0;
}
.specs dd {
  margin: 0;
}
</style>
