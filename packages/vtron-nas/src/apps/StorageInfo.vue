<!--
 * @author vtron-nas
 * 存储空间信息仪表盘
-->
<template>
  <div class="storage-info">
    <h2>存储空间</h2>
    <div v-if="loading" class="si-loading">加载中...</div>
    <template v-else>
      <!-- 圆环图 -->
      <div class="si-chart">
        <svg viewBox="0 0 120 120" width="180" height="180">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#e0e0e0" stroke-width="12" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            :stroke="usedColor"
            stroke-width="12"
            stroke-linecap="round"
            :stroke-dasharray="dashArray"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 60 60)"
          />
          <text x="60" y="55" text-anchor="middle" font-size="18" font-weight="600" fill="#333">
            {{ info?.usedPercent || 0 }}%
          </text>
          <text x="60" y="72" text-anchor="middle" font-size="10" fill="#888">已使用</text>
        </svg>
      </div>

      <!-- 详细信息 -->
      <div class="si-details">
        <div class="si-row">
          <span class="si-label">总容量</span>
          <span class="si-value">{{ formatSize(info?.total || 0) }}</span>
        </div>
        <div class="si-row">
          <span class="si-label">已使用</span>
          <span class="si-value">{{ formatSize(info?.used || 0) }}</span>
        </div>
        <div class="si-row">
          <span class="si-label">可用</span>
          <span class="si-value">{{ formatSize(info?.available || 0) }}</span>
        </div>
      </div>

      <button class="si-btn" @click="refresh">刷新</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getStorageInfo } from '../api/storage';

interface StorageData {
  total: number;
  used: number;
  available: number;
  usedPercent: number;
  storagePath: string;
}

const info = ref<StorageData | null>(null);
const loading = ref(false);

const circumference = 2 * Math.PI * 50;
const dashArray = computed(() => `${circumference}`);
const dashOffset = computed(() => {
  const pct = info.value?.usedPercent || 0;
  return String(circumference * (1 - pct / 100));
});
const usedColor = computed(() => {
  const pct = info.value?.usedPercent || 0;
  if (pct > 90) return '#e74c3c';
  if (pct > 70) return '#f39c12';
  return '#27ae60';
});

async function refresh() {
  loading.value = true;
  try {
    info.value = await getStorageInfo();
  } finally {
    loading.value = false;
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

onMounted(refresh);
</script>

<style scoped>
.storage-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #fff;
  height: 100%;
}
.storage-info h2 { margin: 0 0 20px; font-size: 18px; color: #333; }
.si-loading { color: #999; margin-top: 40px; }
.si-chart { margin-bottom: 24px; }
.si-details { width: 100%; max-width: 280px; }
.si-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.si-label { color: #666; }
.si-value { font-weight: 600; color: #333; }
.si-btn {
  margin-top: 20px;
  padding: 6px 20px;
  font-size: 13px;
  cursor: pointer;
  background: #0078d4;
  color: #fff;
  border: none;
  border-radius: 4px;
}
.si-btn:hover { background: #005a9e; }
</style>
