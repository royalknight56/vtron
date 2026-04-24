<!--
 * @author vtron-nas
 * 文件管理器 -- 增强版，支持上传/下载/拖拽
-->
<template>
  <div class="file-manager">
    <!-- 工具栏 -->
    <div class="fm-toolbar">
      <button class="fm-btn" @click="goUp" :disabled="currentPath === '/'">↑ 上级</button>
      <input
        class="fm-path-input"
        v-model="pathInput"
        @keyup.enter="navigateTo(pathInput)"
      />
      <button class="fm-btn" @click="navigateTo(pathInput)">前往</button>
      <button class="fm-btn primary" @click="triggerUpload">上传文件</button>
      <button class="fm-btn" @click="createFolder">新建文件夹</button>
      <input
        ref="fileInputRef"
        type="file"
        multiple
        style="display: none"
        @change="handleFileSelect"
      />
    </div>

    <!-- 文件列表 -->
    <div
      class="fm-file-list"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <div v-if="loading" class="fm-loading">加载中...</div>
      <div v-else-if="files.length === 0" class="fm-empty">
        空文件夹，拖拽文件到此处上传
      </div>
      <div
        v-for="file in files"
        :key="file.path"
        class="fm-file-item"
        :class="{ selected: selectedFile?.path === file.path }"
        @click="selectFile(file)"
        @dblclick="openItem(file)"
        @contextmenu.prevent="showContextMenu($event, file)"
      >
        <span class="fm-icon">{{ file.isDirectory ? '📁' : getFileIcon(file.name) }}</span>
        <span class="fm-name">{{ file.name }}</span>
        <span class="fm-size">{{ file.isDirectory ? '-' : formatSize(file.size) }}</span>
        <span class="fm-time">{{ formatTime(file.mtime) }}</span>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.visible"
      class="fm-context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click="contextMenu.visible = false"
    >
      <div class="fm-menu-item" @click="downloadFile">下载</div>
      <div class="fm-menu-item" @click="shareFile">分享</div>
      <div class="fm-menu-item" @click="renameItem">重命名</div>
      <div class="fm-menu-item danger" @click="deleteItem">删除</div>
    </div>

    <!-- 上传进度 -->
    <div v-if="uploading" class="fm-upload-bar">
      正在上传 {{ uploadFileName }}...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as fsApi from '../api/fs';
import { uploadFile } from '../api/fs';

interface FileItem {
  name: string;
  path: string;
  parentPath: string;
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  mtime: string;
}

const currentPath = ref('/');
const pathInput = ref('/');
const files = ref<FileItem[]>([]);
const loading = ref(false);
const selectedFile = ref<FileItem | null>(null);
const uploading = ref(false);
const uploadFileName = ref('');
const fileInputRef = ref<HTMLInputElement>();

const contextMenu = ref({ visible: false, x: 0, y: 0 });

async function loadFiles() {
  loading.value = true;
  try {
    files.value = await fsApi.readdir(currentPath.value);
    /* 目录在前，文件在后 */
    files.value.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  } catch {
    files.value = [];
  } finally {
    loading.value = false;
  }
}

function navigateTo(path: string) {
  currentPath.value = path || '/';
  pathInput.value = currentPath.value;
  selectedFile.value = null;
  loadFiles();
}

function goUp() {
  const parts = currentPath.value.split('/').filter(Boolean);
  parts.pop();
  navigateTo('/' + parts.join('/'));
}

function openItem(file: FileItem) {
  if (file.isDirectory) {
    navigateTo(file.path);
  } else {
    /* 普通文件 -- 在新窗口下载预览 */
    window.open(fsApi.getPreviewUrl(file.path), '_blank');
  }
}

function selectFile(file: FileItem) {
  selectedFile.value = file;
  contextMenu.value.visible = false;
}

function showContextMenu(e: MouseEvent, file: FileItem) {
  selectedFile.value = file;
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY };
}

function downloadFile() {
  if (!selectedFile.value) return;
  const a = document.createElement('a');
  a.href = fsApi.getDownloadUrl(selectedFile.value.path);
  a.download = selectedFile.value.name;
  a.click();
}

function shareFile() {
  if (!selectedFile.value) return;
  /* 后续由分享管理器处理 */
  alert(`分享功能: ${selectedFile.value.path}`);
}

async function renameItem() {
  if (!selectedFile.value) return;
  const newName = prompt('请输入新名称', selectedFile.value.name);
  if (!newName || newName === selectedFile.value.name) return;
  const parentDir = selectedFile.value.path.substring(0, selectedFile.value.path.lastIndexOf('/'));
  const newPath = parentDir + '/' + newName;
  await fsApi.renameFile(selectedFile.value.path, newPath);
  loadFiles();
}

async function deleteItem() {
  if (!selectedFile.value) return;
  if (!confirm(`确定删除 "${selectedFile.value.name}" 吗？`)) return;
  if (selectedFile.value.isDirectory) {
    await fsApi.rmdir(selectedFile.value.path);
  } else {
    await fsApi.unlinkFile(selectedFile.value.path);
  }
  selectedFile.value = null;
  loadFiles();
}

async function createFolder() {
  const name = prompt('请输入文件夹名称');
  if (!name) return;
  const dirPath = currentPath.value.replace(/\/$/, '') + '/' + name;
  await fsApi.mkdir(dirPath);
  loadFiles();
}

function triggerUpload() {
  fileInputRef.value?.click();
}

async function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files) return;
  for (const file of Array.from(input.files)) {
    await doUpload(file);
  }
  input.value = '';
  loadFiles();
}

async function handleDrop(e: DragEvent) {
  const droppedFiles = e.dataTransfer?.files;
  if (!droppedFiles) return;
  for (const file of Array.from(droppedFiles)) {
    await doUpload(file);
  }
  loadFiles();
}

async function doUpload(file: File) {
  uploading.value = true;
  uploadFileName.value = file.name;
  try {
    await uploadFile(currentPath.value, file);
  } catch (err) {
    alert(`上传 ${file.name} 失败`);
  } finally {
    uploading.value = false;
  }
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
    mp4: '🎬', mkv: '🎬', avi: '🎬', mov: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵', ogg: '🎵',
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📎', pptx: '📎',
    txt: '📃', md: '📃', json: '📃', xml: '📃',
    zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
    js: '💻', ts: '💻', py: '💻', java: '💻', c: '💻', cpp: '💻',
  };
  return iconMap[ext] || '📄';
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

watch(currentPath, (v) => { pathInput.value = v; });
onMounted(loadFiles);
</script>

<style scoped>
.file-manager {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  background: #fff;
}
.fm-toolbar {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f8f8;
}
.fm-btn {
  padding: 5px 12px;
  font-size: 12px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  white-space: nowrap;
}
.fm-btn:hover:not(:disabled) { background: #e8e8e8; }
.fm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.fm-btn.primary { color: #fff; background: #0078d4; border-color: #0078d4; }
.fm-btn.primary:hover { background: #005a9e; }
.fm-path-input {
  flex: 1;
  padding: 5px 8px;
  font-size: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.fm-file-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.fm-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  user-select: none;
}
.fm-file-item:hover { background: #f0f6ff; }
.fm-file-item.selected { background: #cce4ff; }
.fm-icon { font-size: 18px; width: 24px; text-align: center; }
.fm-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fm-size { width: 80px; text-align: right; color: #888; font-size: 12px; }
.fm-time { width: 140px; text-align: right; color: #888; font-size: 12px; }
.fm-loading, .fm-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}
.fm-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 120px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  padding: 4px 0;
}
.fm-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
}
.fm-menu-item:hover { background: #f0f6ff; }
.fm-menu-item.danger { color: #e74c3c; }
.fm-upload-bar {
  padding: 8px 12px;
  background: #0078d4;
  color: #fff;
  font-size: 13px;
  text-align: center;
}
</style>
