<template>
    <div class="store-outer">
      <div class="store-handle" v-dragable @dblclick="handleDblClick">
        <div class="store-title">STORE</div>
        <div v-if="!closing" @click="closeWin" class="close-button">×</div>
      </div>
      <iframe
        class="store"
        :class="{ closing: closing }"
        ref="storeRef"
        :key="frameKey"
        :src="storeUrl"
        @load="handleIframeLoad"
      ></iframe>
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { inject, onMounted, ref } from 'vue';
  import { System, BrowserWindow, Dialog, basename, vDragable } from 'vtron';

  const system = inject<System>('system')!;
  
  const storeRef = ref<HTMLIFrameElement | null>(null);
  const frameKey = ref(0);
  const closing = ref(false);
  const isLoading = ref(true);
  const storeUrl = "https://vtron.site/react/#/background/";

  const browserWindow: BrowserWindow = inject('browserWindow')!;
  const handleMessage = (event: MessageEvent) => {
    if (event.source !== storeRef.value?.contentWindow) {
      return;
    }
    const rec: any = event.data;
    switch (rec.type) {
      case 'background-set':
        handleInstall(rec.data);
        break;
    case "ready":
        handleReady();
        break;
      default:
        break;
    }
  };
  
  const handleInstall = (data: any) => {
    if (!system) {
      return;
    }
    system.setConfig('background', data.background);

    storeRef.value?.contentWindow?.postMessage(
      {
        type: 'current',
        data: data.background,
      },
      '*'
    );

  };
  
  const handleReady = () => {
    storeRef.value?.contentWindow?.postMessage(
      {
        type: 'current',
        data: system.getConfig('background'),
      },
      '*'
    );
  };
  
  const handleIframeLoad = () => {
    isLoading.value = false;
  };

  function handleDblClick() {
    if (browserWindow.isMaximized()) {
      browserWindow.unmaximize();
    } else {
      browserWindow.maximize();
    }
  }

  
  onMounted(() => {
    window.addEventListener('message', handleMessage);
  });
  
  function closeWin() {
    closing.value = true;
    setTimeout(() => {
      browserWindow.close();
    }, 200);
  }
  </script>
  
  <style scoped>
  .store-outer {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-radius: 6px;
    background-color: rgb(243, 243, 243);
    overflow: hidden;
    position: relative;
  }
  
  .store-handle {
    width: 100%;
    height: 40px;
    user-select: none;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    position: absolute;
    background-color: #eee;
  }
  .store-title {
    font-size: 12px;
    color: rgba(117, 117, 117, 0.675);
    border-top-right-radius: 10px;
    line-height: 40px;
    user-select: none;
    padding-left: 10px;
  }
  .up-text {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    padding: 0 40px;
    font-size: 12px;
    color: rgba(117, 117, 117, 0.675);
    background-color: rgb(243, 243, 243);
    border-top-right-radius: 10px;
    user-select: none;
  }
  .close-button {
    user-select: none;
    width: 60px;
    height: 100%;
    font-size: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(255, 0, 0, 0);
    transition: all 0.2s;
    cursor: pointer;
  }
  .close-button:hover {
    background-color: red;
    color: white;
  }
  .store {
    margin-top: 40px;
    width: 100%;
    height: 100%;
    border: none;
    background-color: white;
  }
  .closing {
    animation: closing 0.23s;
  }
  @keyframes closing {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  .loading-overlay {
    position: absolute;
    top: 40px;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  </style>
  