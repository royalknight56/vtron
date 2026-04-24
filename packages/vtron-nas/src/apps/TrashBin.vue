<!--
 * @author vtron-nas
 * 回收站应用
-->
<template>
  <div class="trash-bin">
    <div class="tb-toolbar">
      <span class="tb-title">回收站</span>
      <button class="tb-btn" @click="refresh">刷新</button>
      <button class="tb-btn danger" @click="handleEmptyTrash" :disabled="items.length === 0">
        清空回收站
      </button>
    </div>
    <div class="tb-list">
      <div v-if="loading" class="tb-empty">加载中...</div>
      <div v-else-if="items.length === 0" class="tb-empty">回收站为空</div>
      <div
        v-for="item in items"
        :key="item.id"
        class="tb-item"
      >
        <span class="tb-icon">{{ item.is_directory ? '📁' : '📄' }}</span>
        <span class="tb-name">{{ getFileName(item.original_path) }}</span>
        <span class="tb-path">{{ item.original_path }}</span>
        <span class="tb-time">{{ item.deleted_at }}</span>
        <button class="tb-btn small" @click="handleRestore(item.id)">恢复</button>
        <button class="tb-btn small danger" @click="handlePurge(item.id)">彻底删除</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listTrash, restoreTrash, purgeTrash, emptyTrash } from '../api/trash';

interface TrashItem {
  id: number;
  original_path: string;
  trash_name: string;
  deleted_by: string;
  deleted_at: string;
  is_directory: number;
  size: number;
}

const items = ref<TrashItem[]>([]);
const loading = ref(false);

async function refresh() {
  loading.value = true;
  try {
    items.value = await listTrash();
  } finally {
    loading.value = false;
  }
}

async function handleRestore(id: number) {
  await restoreTrash(id);
  refresh();
}

async function handlePurge(id: number) {
  if (!confirm('确定彻底删除此文件？此操作不可恢复！')) return;
  await purgeTrash(id);
  refresh();
}

async function handleEmptyTrash() {
  if (!confirm('确定清空回收站？所有文件将被永久删除！')) return;
  await emptyTrash();
  refresh();
}

function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

onMounted(refresh);
</script>

<style scoped>
.trash-bin {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  background: #fff;
}
.tb-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f8f8;
  border-bottom: 1px solid #e0e0e0;
}
.tb-title { font-weight: 600; flex: 1; }
.tb-btn {
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.tb-btn:hover:not(:disabled) { background: #e8e8e8; }
.tb-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.tb-btn.danger { color: #e74c3c; border-color: #e74c3c; }
.tb-btn.small { padding: 2px 8px; }
.tb-list { flex: 1; overflow-y: auto; padding: 4px 0; }
.tb-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
}
.tb-item:hover { background: #f5f5f5; }
.tb-icon { font-size: 16px; }
.tb-name { width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
.tb-path { flex: 1; color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
.tb-time { width: 140px; color: #888; font-size: 12px; }
.tb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}
</style>
