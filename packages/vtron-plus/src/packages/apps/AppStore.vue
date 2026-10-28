<template>
  <div class="store-outer" :class="{ closing }">
    <div class="store-handle" v-dragable @dblclick="maxWin">
      <span class="store-title">应用商店</span>
      <button
        type="button"
        class="close-button"
        aria-label="关闭应用商店"
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
      title="应用商店"
      @load="isLoading = false"
    ></iframe>
    <div v-if="isLoading" class="loading-overlay" role="status">
      <span class="loading-spinner" aria-hidden="true"></span>
      <span>正在加载应用商店</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject, onBeforeUnmount, onMounted, ref } from 'vue';
import * as vue from 'vue';
import { System, BrowserWindow, basename, vDragable } from 'vtron';

type Operation = 'install' | 'uninstall' | 'open';
type AppRequest = {
  name: string;
  type?: 'all' | 'once';
  content?: string;
  uninstallContent?: string;
};

const system = inject<System>('system')!;
const browserWindow = inject<BrowserWindow>('browserWindow')!;
const storeRef = ref<HTMLIFrameElement | null>(null);
const closing = ref(false);
const isLoading = ref(true);
const storeUrl = new URL(
  import.meta.env.VITE_APP_STORE_URL ||
    (import.meta.env.PROD ? 'https://vtronjs.com/subapps/store/' : 'http://localhost:3001')
);
let busy = false;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

function sendMessage(type: string, data: unknown) {
  storeRef.value?.contentWindow?.postMessage({ type, data }, storeUrl.origin);
}

async function sendInstalledApps() {
  const files = await system.fs.readdir(`${system._options.systemLocation}plugs`);
  sendMessage(
    'init',
    files.map((item) => ({ name: basename(item.path) }))
  );
}

function parseRequest(data: unknown): AppRequest | null {
  if (!data || typeof data !== 'object') return null;
  const request = data as Record<string, unknown>;
  if (
    typeof request.name !== 'string' ||
    request.name.length <= 3 ||
    !request.name.endsWith('.js') ||
    /[/\\\0]/.test(request.name)
  )
    return null;
  return request as AppRequest;
}

async function runScript(source: string) {
  // 与 node 命令使用相同运行环境，并等待 main 返回的异步文件操作完成。
  await new Function('system', 'vue', `${source}\nreturn main(system, vue);`)(system, vue);
}

async function operate(operation: Operation, data: unknown) {
  const request = parseRequest(data);
  if (!request) return;

  const report = (success: boolean, message?: string) => {
    sendMessage('operation-result', { name: request.name, operation, success, message });
  };
  if (busy) {
    report(false, '请等待当前操作完成。');
    return;
  }

  const markerPath = `${system._options.systemLocation}plugs/${request.name}`;
  busy = true;
  try {
    if (operation === 'open') {
      const shortcut = `${system._options.userLocation}Desktop/${request.name.slice(0, -3)}.url`;
      if (!(await system.fs.stat(markerPath)) || !(await system.fs.stat(shortcut))) {
        throw new Error('App is not installed');
      }
      await system.openFile(shortcut);
      report(true);
      return;
    }

    if (request.type !== 'all' && request.type !== 'once') throw new Error('Invalid app type');

    if (operation === 'install') {
      if (typeof request.content !== 'string' || !request.content.trim()) {
        throw new Error('Missing install script');
      }
      if (request.type === 'once') {
        await runScript(request.content);
        await system.fs.writeFile(markerPath, 'function main(){}');
      } else {
        await system.fs.writeFile(markerPath, request.content);
      }
    } else {
      if (request.type === 'once') {
        if (typeof request.uninstallContent !== 'string' || !request.uninstallContent.trim()) {
          throw new Error('Missing uninstall script');
        }
        await runScript(request.uninstallContent);
      }
      await system.fs.unlink(markerPath);
    }

    await sendInstalledApps();
    const restart = request.type === 'all' ? '，重启桌面后生效' : '';
    report(true, `${operation === 'install' ? '安装成功' : '卸载成功'}${restart}`);
  } catch {
    report(
      false,
      `${operation === 'install' ? '安装' : operation === 'uninstall' ? '卸载' : '打开'}失败，请重试。`
    );
  } finally {
    busy = false;
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

  const message = event.data;
  if (message.type === 'ready') {
    void sendInstalledApps().catch(() => sendMessage('store-error', '应用列表加载失败，请重新打开商店。'));
  } else if (message.type === 'install' || message.type === 'uninstall' || message.type === 'open') {
    void operate(message.type, message.data);
  }
}

onMounted(() => window.addEventListener('message', handleMessage));
onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage);
  clearTimeout(closeTimer);
});

function closeWin() {
  if (closing.value) return;
  closing.value = true;
  closeTimer = setTimeout(() => browserWindow.close(), 160);
}

function maxWin() {
  if (browserWindow.isMaximized()) {
    browserWindow.unmaximize();
  } else {
    browserWindow.maximize();
  }
}
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
  background: white;
}

.loading-overlay {
  position: absolute;
  inset: 36px 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f7f8fa;
  color: #5b616a;
  font-size: 13px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #dce6ed;
  border-top-color: #0067c0;
  border-radius: 50%;
  animation: store-spin 800ms linear infinite;
}

.closing {
  animation: store-close 160ms ease-in forwards;
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
