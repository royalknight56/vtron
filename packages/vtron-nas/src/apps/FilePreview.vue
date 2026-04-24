<!--
 * @author vtron-nas
 * 文件预览器 -- 支持图片/视频/音频/文本
-->
<template>
  <div class="file-preview">
    <div class="fp-toolbar">
      <span class="fp-filename">{{ fileName }}</span>
      <button class="fp-btn" @click="downloadCurrent">下载</button>
    </div>
    <div class="fp-content">
      <!-- 图片 -->
      <img v-if="previewType === 'image'" :src="previewUrl" class="fp-image" />
      <!-- 视频 -->
      <video v-else-if="previewType === 'video'" :src="previewUrl" controls class="fp-video" />
      <!-- 音频 -->
      <audio v-else-if="previewType === 'audio'" :src="previewUrl" controls class="fp-audio" />
      <!-- 文本 -->
      <pre v-else-if="previewType === 'text'" class="fp-text">{{ textContent }}</pre>
      <!-- 不支持 -->
      <div v-else class="fp-unsupported">
        <p>不支持预览此文件类型</p>
        <button class="fp-btn primary" @click="downloadCurrent">下载文件</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getPreviewUrl, getDownloadUrl, readFile } from '../api/fs';
import { getToken } from '../api/client';

const props = defineProps<{ filePath: string }>();

const textContent = ref('');
const fileName = computed(() => props.filePath.split('/').pop() || '');

const ext = computed(() => {
  const parts = fileName.value.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
});

const previewType = computed(() => {
  const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'mkv'];
  const audioExts = ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'];
  const textExts = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'c', 'cpp', 'h', 'sh', 'yml', 'yaml', 'toml', 'ini', 'cfg', 'log', 'csv'];

  if (imgExts.includes(ext.value)) return 'image';
  if (videoExts.includes(ext.value)) return 'video';
  if (audioExts.includes(ext.value)) return 'audio';
  if (textExts.includes(ext.value)) return 'text';
  return 'unknown';
});

const previewUrl = computed(() => {
  const url = getPreviewUrl(props.filePath);
  const token = getToken();
  return token ? `${url}&token=${token}` : url;
});

function downloadCurrent() {
  const a = document.createElement('a');
  a.href = getDownloadUrl(props.filePath);
  a.download = fileName.value;
  a.click();
}

onMounted(async () => {
  if (previewType.value === 'text') {
    textContent.value = (await readFile(props.filePath)) || '';
  }
});
</script>

<style scoped>
.file-preview {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #1e1e1e;
  color: #fff;
}
.fp-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #2d2d2d;
  border-bottom: 1px solid #444;
}
.fp-filename { font-size: 13px; font-weight: 500; }
.fp-btn {
  padding: 4px 12px;
  font-size: 12px;
  color: #fff;
  cursor: pointer;
  background: #444;
  border: 1px solid #555;
  border-radius: 4px;
}
.fp-btn:hover { background: #555; }
.fp-btn.primary { background: #0078d4; border-color: #0078d4; }
.fp-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 16px;
}
.fp-image { max-width: 100%; max-height: 100%; object-fit: contain; }
.fp-video { max-width: 100%; max-height: 100%; }
.fp-audio { width: 80%; }
.fp-text {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #d4d4d4;
  white-space: pre-wrap;
  overflow: auto;
  background: #1e1e1e;
}
.fp-unsupported {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #aaa;
}
</style>
