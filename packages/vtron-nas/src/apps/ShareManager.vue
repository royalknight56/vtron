<!--
 * @author vtron-nas
 * 分享管理器
-->
<template>
  <div class="share-manager">
    <div class="sm-toolbar">
      <span class="sm-title">我的分享</span>
      <button class="sm-btn" @click="refresh">刷新</button>
    </div>
    <div class="sm-list">
      <div v-if="loading" class="sm-empty">加载中...</div>
      <div v-else-if="shares.length === 0" class="sm-empty">暂无分享</div>
      <div v-for="share in shares" :key="share.id" class="sm-item">
        <div class="sm-info">
          <span class="sm-file-path">{{ share.file_path }}</span>
          <span class="sm-meta">
            下载次数: {{ share.download_count }}
            <span v-if="share.expires_at"> | 过期: {{ share.expires_at }}</span>
            <span v-if="share.password"> | 🔒 有密码</span>
          </span>
        </div>
        <div class="sm-actions">
          <button class="sm-btn small" @click="copyLink(share.token)">复制链接</button>
          <button class="sm-btn small danger" @click="handleDelete(share.id)">取消分享</button>
        </div>
      </div>
    </div>

    <!-- 创建分享表单 -->
    <div class="sm-create">
      <h3>创建新分享</h3>
      <input v-model="newShare.filePath" placeholder="文件路径 (如 /documents/readme.txt)" class="sm-input" />
      <input v-model="newShare.password" placeholder="分享密码 (可选)" type="password" class="sm-input" />
      <input v-model.number="newShare.expiresInHours" placeholder="过期时间 (小时, 可选)" type="number" class="sm-input" />
      <button class="sm-btn primary" @click="handleCreate">创建分享链接</button>
      <p v-if="lastCreatedLink" class="sm-result">
        分享链接已创建: <code>{{ lastCreatedLink }}</code>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { createShare, listShares, deleteShare } from '../api/share';

interface ShareRecord {
  id: number;
  token: string;
  file_path: string;
  created_by: string;
  password: string | null;
  expires_at: string | null;
  download_count: number;
  created_at: string;
}

const shares = ref<ShareRecord[]>([]);
const loading = ref(false);
const lastCreatedLink = ref('');

const newShare = ref({
  filePath: '',
  password: '',
  expiresInHours: undefined as number | undefined,
});

async function refresh() {
  loading.value = true;
  try {
    shares.value = await listShares();
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  if (!newShare.value.filePath) { alert('请输入文件路径'); return; }
  const record = await createShare(
    newShare.value.filePath,
    newShare.value.password || undefined,
    newShare.value.expiresInHours
  );
  lastCreatedLink.value = `${window.location.origin}/api/share/public/${record.token}`;
  newShare.value = { filePath: '', password: '', expiresInHours: undefined };
  refresh();
}

async function handleDelete(id: number) {
  if (!confirm('确定取消此分享？')) return;
  await deleteShare(id);
  refresh();
}

function copyLink(token: string) {
  const link = `${window.location.origin}/api/share/public/${token}`;
  navigator.clipboard.writeText(link).then(() => alert('链接已复制'));
}

onMounted(refresh);
</script>

<style scoped>
.share-manager {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  background: #fff;
}
.sm-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f8f8;
  border-bottom: 1px solid #e0e0e0;
}
.sm-title { font-weight: 600; flex: 1; }
.sm-btn {
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.sm-btn:hover { background: #e8e8e8; }
.sm-btn.primary { color: #fff; background: #0078d4; border-color: #0078d4; }
.sm-btn.primary:hover { background: #005a9e; }
.sm-btn.danger { color: #e74c3c; border-color: #e74c3c; }
.sm-btn.small { padding: 2px 8px; }
.sm-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.sm-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}
.sm-info { display: flex; flex-direction: column; gap: 2px; }
.sm-file-path { font-weight: 500; }
.sm-meta { font-size: 12px; color: #888; }
.sm-actions { display: flex; gap: 4px; }
.sm-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: #999;
}
.sm-create {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}
.sm-create h3 { margin: 0 0 8px; font-size: 14px; }
.sm-input {
  display: block;
  width: 100%;
  padding: 6px 8px;
  margin-bottom: 6px;
  font-size: 13px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.sm-result { margin: 8px 0 0; font-size: 12px; color: #27ae60; }
.sm-result code { background: #e8f5e9; padding: 2px 6px; border-radius: 3px; }
</style>
