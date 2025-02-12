<template>
  <div class="file-uploader" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
    <input ref="fileInput" class="upload-input" type="file" :accept="accept" @change="uploadFile" hidden />
    <slot>
      <div class="default-upload-btn" :class="{ 'is-loading': uploadLoading }">
        <span class="btn-icon segoicon SEGOEUIMDL" v-if="!uploadLoading">&#xE7C5;</span>
        <div class="loading-spinner" v-else>
          <svg viewBox="0 0 50 50" class="circular">
            <circle cx="25" cy="25" r="20" fill="none" class="path"></circle>
          </svg>
        </div>
        <span class="btn-text">{{ uploadLoading ? '上传中...' : '选择文件' }}</span>
      </div>
    </slot>

    <!-- 进度条 -->
    <div class="progress-bar" v-if="uploadLoading">
      <div class="progress-inner" :style="{ width: `${progress}%` }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
  accept: {
    type: String,
    default: '*',
  },
});

const emits = defineEmits(['change']);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadLoading = ref(false);
const progress = ref(0);

function triggerUpload() {
  fileInput.value?.click();
}

async function uploadFile(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    uploadLoading.value = true;
    progress.value = 0;

    // 模拟上传进度
    const interval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.random() * 10;
      }
    }, 200);

    try {
      emits('change', e);
      progress.value = 100;
    } finally {
      setTimeout(() => {
        uploadLoading.value = false;
        progress.value = 0;
        clearInterval(interval);
      }, 500);
    }
  }
}

function handleDrop(e: DragEvent) {
  if (e.dataTransfer?.files) {
    const file = e.dataTransfer.files[0];
    const input = fileInput.value;
    if (input) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      uploadFile({ target: input } as unknown as Event);
    }
  }
}
</script>

<style lang="scss" scoped>
.file-uploader {
  position: relative;
  display: inline-block;
}

.default-upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 4px;
  background: #fff;
  border: 1px solid #dcdfe6;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: #409eff;
    border-color: #c6e2ff;
    background-color: #ecf5ff;
  }

  &.is-loading {
    cursor: not-allowed;
    background-color: #f5f7fa;
    border-color: #dcdfe6;
    color: #c0c4cc;
  }

  .btn-icon {
    margin-right: 8px;
    font-size: 16px;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    margin-right: 8px;

    .circular {
      animation: rotating 2s linear infinite;

      .path {
        stroke: #c0c4cc;
        stroke-width: 4;
        stroke-dasharray: 90, 150;
        stroke-dashoffset: 0;
        stroke-linecap: round;
        animation: dash 1.5s ease-in-out infinite;
      }
    }
  }
}

.progress-bar {
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #e4e7ed;
  border-radius: 2px;
  overflow: hidden;

  .progress-inner {
    height: 100%;
    background: #409eff;
    transition: width 0.2s linear;
  }
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>
