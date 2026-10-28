<template>
  <div class="store-outer" :class="{ closing }">
    <div class="store-handle" v-dragable @dblclick="handleDblClick">
      <span class="store-title">背景商店</span>
      <button
        type="button"
        class="close-button"
        aria-label="关闭背景商店"
        :disabled="closing"
        @mousedown.stop
        @dblclick.stop
        @click="closeWin"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="m4 4 8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
    <iframe
      ref="storeRef"
      class="store"
      :src="storeUrl.href"
      title="背景商店"
      @load="isLoading = false"
    ></iframe>
    <div v-if="isLoading" class="loading-overlay" role="status">
      <span class="loading-spinner" aria-hidden="true"></span>
      <span>正在加载背景商店</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject, onBeforeUnmount, onMounted, ref } from 'vue';
import { System, BrowserWindow, vDragable } from 'vtron';

const system = inject<System>('system')!;
const browserWindow = inject<BrowserWindow>('browserWindow')!;
const storeRef = ref<HTMLIFrameElement | null>(null);
const closing = ref(false);
const isLoading = ref(true);
const storeUrl = new URL(
  import.meta.env.VITE_BACKGROUND_STORE_URL || 'https://vtronjs.com/subapps/react/#/background/'
);
const backgroundIds = new Set([
  'light',
  'dark',
  'particles',
  'gradient',
  'stars',
  'bubbles',
  'minimal',
  'aurora',
  'dunes',
  'ocean',
  'forest',
  'bloom',
  'grid',
]);
let closeTimer: ReturnType<typeof setTimeout> | undefined;

function sendMessage(type: string, data: unknown) {
  storeRef.value?.contentWindow?.postMessage({ type, data }, storeUrl.origin);
}

async function applyBackground(data: unknown) {
  if (!data || typeof data !== 'object' || !('background' in data) || typeof data.background !== 'string') {
    sendMessage('background-error', '背景地址无效，请重试。');
    return;
  }

  let backgroundUrl: URL;
  try {
    backgroundUrl = new URL(data.background);
    const id = backgroundUrl.hash.match(/^#\/background\/([^/?#]+)\/?$/)?.[1];
    if (
      backgroundUrl.origin !== storeUrl.origin ||
      backgroundUrl.pathname !== storeUrl.pathname ||
      backgroundUrl.search !== storeUrl.search ||
      backgroundUrl.username ||
      backgroundUrl.password ||
      !id ||
      !backgroundIds.has(id)
    ) {
      throw new Error('Invalid background URL');
    }
  } catch {
    sendMessage('background-error', '背景地址无效，请重试。');
    return;
  }

  const previousBackground = system.getConfig('background');
  try {
    await system.setConfig('background', backgroundUrl.href);
    sendMessage('current', system.getConfig('background'));
  } catch {
    // setConfig 先更新内存再持久化；保存失败时恢复原背景。
    try {
      await system.setConfig('background', previousBackground);
    } catch {
      // 即使持久化不可用，setConfig 仍已恢复当前会话的背景。
    }
    sendMessage('background-error', '背景保存失败，请重试。');
  }
}

function handleMessage(event: MessageEvent) {
  if (
    event.source !== storeRef.value?.contentWindow ||
    event.origin !== storeUrl.origin ||
    !event.data ||
    typeof event.data !== 'object'
  )
    return;

  if (event.data.type === 'ready') {
    sendMessage('current', system.getConfig('background'));
  } else if (event.data.type === 'background-set') {
    void applyBackground(event.data.data);
  }
}

function handleDblClick() {
  if (browserWindow.isMaximized()) {
    browserWindow.unmaximize();
  } else {
    browserWindow.maximize();
  }
}

function closeWin() {
  if (closing.value) return;
  closing.value = true;
  closeTimer = setTimeout(() => browserWindow.close(), 160);
}

onMounted(() => window.addEventListener('message', handleMessage));
onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage);
  clearTimeout(closeTimer);
});
</script>

<style scoped>
.store-outer {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  background: #f3f3f3;
  box-sizing: border-box;
  font-family: 'Segoe UI', 'Microsoft YaHei', system-ui, sans-serif;
}

.store-handle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 36px;
  user-select: none;
  background: #f3f3f3;
}

.store-title {
  padding-left: 14px;
  color: #30343b;
  font-size: 12px;
}

.close-button {
  display: grid;
  place-items: center;
  align-self: stretch;
  width: 46px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #333;
  cursor: pointer;
  transition:
    background 120ms,
    color 120ms;
}

.close-button svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1;
}

.close-button:hover {
  color: white;
  background: #c42b1c;
}

.close-button:active {
  color: white;
  background: #a92519;
  transition: none;
}

.close-button:focus-visible {
  outline: 2px solid #0067c0;
  outline-offset: -3px;
}

.store {
  display: block;
  width: 100%;
  flex: 1 1 0;
  min-height: 0;
  border: 0;
  background: #f7f8fa;
}

.closing {
  animation: store-close 160ms ease-in forwards;
}

.loading-overlay {
  position: absolute;
  inset: 36px 0 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  color: #5b616a;
  font-size: 13px;
  background: #f7f8fa;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #dce6ed;
  border-top-color: #0067c0;
  border-radius: 50%;
  animation: store-spin 800ms linear infinite;
}

@keyframes store-close {
  to {
    opacity: 0;
    transform: scale(0.985);
  }
}

@keyframes store-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .closing {
    animation: store-close-fade 100ms ease-out forwards;
  }
  .loading-spinner {
    animation: none;
  }
  .close-button {
    transition: none;
  }
}

@keyframes store-close-fade {
  to {
    opacity: 0;
  }
}

@media (prefers-contrast: more) {
  .store-outer {
    border-color: #30343b;
  }
  .store-title,
  .loading-overlay {
    color: #171a20;
  }
}
</style>
