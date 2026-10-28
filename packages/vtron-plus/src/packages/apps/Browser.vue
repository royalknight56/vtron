<script lang="ts" setup>
import { inject, nextTick, onMounted, ref } from 'vue';
import { BrowserWindow, System, vDragable, WinUpButtonGroupVue, join } from 'vtron';
import BrowserTab from './Browser/BrowserTab.vue';
import BrowserIcon from './Browser/BrowserIcon.vue';

type Tab = { id: number; title: string; loading: boolean };
const browserWindow = inject<BrowserWindow>('browserWindow')!;
const sys = inject<System>('system')!;
const settingsId = 'browser-settings-' + browserWindow.id;
const rootRef = ref<HTMLElement | null>(null);
const tabs = ref<Tab[]>([{ id: 0, title: '新标签页', loading: true }]);
const currentTab = ref(0);
let tabCounter = 0;

const showSettings = ref(false);
const proxyUrl = ref('');
const proxyEnabled = ref(false);
const draftProxyUrl = ref('');
const draftProxyEnabled = ref(false);
const settingsError = ref('');
const savingSettings = ref(false);
const SETTINGS_PATH = join(sys._options.userLocation || '', 'Config', 'browser.json');

function updateTab(tab: Tab, state: { title: string; loading: boolean }) {
  tab.title = state.title;
  tab.loading = state.loading;
}

function revealTab(focus = false) {
  nextTick(() => {
    const button = rootRef.value?.querySelector<HTMLButtonElement>(`[data-tab-id="${currentTab.value}"]`);
    button?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (focus) button?.focus();
  });
}

function addTab() {
  const tab = { id: ++tabCounter, title: '新标签页', loading: true };
  tabs.value.push(tab);
  currentTab.value = tab.id;
  showSettings.value = false;
  revealTab(true);
}

function removeTab(id: number) {
  const index = tabs.value.findIndex((tab) => tab.id === id);
  if (index < 0) return;
  tabs.value.splice(index, 1);
  if (!tabs.value.length) {
    addTab();
    return;
  }
  if (currentTab.value === id) {
    currentTab.value = (tabs.value[index] || tabs.value[index - 1]).id;
    showSettings.value = false;
    revealTab(true);
  }
}

function switchTab(id: number) {
  currentTab.value = id;
  showSettings.value = false;
  revealTab();
}

function moveTab(direction: number) {
  const index = tabs.value.findIndex((tab) => tab.id === currentTab.value);
  const next = (index + direction + tabs.value.length) % tabs.value.length;
  switchTab(tabs.value[next].id);
  revealTab(true);
}

function toggleMaximize(event: MouseEvent) {
  if ((event.target as HTMLElement).closest('button, .browser__tab, .browser__winbtns')) return;
  if (!browserWindow.isResizable()) return;
  if (browserWindow.isMaximized()) browserWindow.unmaximize();
  else browserWindow.maximize();
}

function openSettings() {
  draftProxyUrl.value = proxyUrl.value;
  draftProxyEnabled.value = proxyEnabled.value;
  settingsError.value = '';
  showSettings.value = true;
}

async function loadSettings() {
  try {
    const raw = await sys.fs.readFile(SETTINGS_PATH);
    if (!raw) return;
    const config = JSON.parse(raw);
    proxyUrl.value = typeof config.proxyUrl === 'string' ? config.proxyUrl : '';
    proxyEnabled.value = config.proxyEnabled === true && !!proxyUrl.value;
  } catch {
    // Use direct browsing when no settings have been saved.
  }
}

async function saveSettings() {
  if (savingSettings.value) return;
  const url = draftProxyUrl.value.trim();
  settingsError.value = '';
  if (draftProxyEnabled.value) {
    try {
      const parsed = new URL(url.replaceAll('{url}', encodeURIComponent('https://example.com')));
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Invalid proxy');
    } catch {
      settingsError.value = '请输入有效的 HTTP 或 HTTPS 代理地址';
      return;
    }
  }
  savingSettings.value = true;
  try {
    const directory = join(sys._options.userLocation || '', 'Config');
    try { await sys.fs.mkdir(directory); } catch { /* Directory may already exist. */ }
    await sys.fs.writeFile(SETTINGS_PATH, JSON.stringify({ proxyUrl: url, proxyEnabled: draftProxyEnabled.value }));
    proxyUrl.value = url;
    proxyEnabled.value = draftProxyEnabled.value;
    showSettings.value = false;
    sys.createNotify({ title: '浏览器', content: '设置已保存' });
  } catch {
    settingsError.value = '保存失败，请重试';
  } finally {
    savingSettings.value = false;
  }
}

onMounted(loadSettings);
</script>

<template>
  <div ref="rootRef" class="browser">
    <header class="browser__tabbar" v-dragable @dblclick="toggleMaximize">
      <div class="browser__tabs" role="tablist" aria-label="浏览器标签页">
        <div v-for="tab in tabs" :key="tab.id" class="browser__tab" :class="{ 'browser__tab--active': currentTab === tab.id && !showSettings }" @mousedown.stop @touchstart.stop @dblclick.stop>
          <button
            type="button"
            role="tab"
            class="browser__tab-select"
            :id="`browser-tab-${browserWindow.id}-${tab.id}`"
            :data-tab-id="tab.id"
            :aria-selected="currentTab === tab.id && !showSettings"
            :aria-controls="`browser-panel-${browserWindow.id}-${tab.id}`"
            :tabindex="currentTab === tab.id ? 0 : -1"
            :title="tab.title"
            @click="switchTab(tab.id)"
            @keydown.left.prevent="moveTab(-1)"
            @keydown.right.prevent="moveTab(1)"
          >
            <span v-if="tab.loading" class="browser__tab-spinner" aria-hidden="true"></span>
            <BrowserIcon v-else :name="tab.title === '新标签页' ? 'home' : 'globe'" />
            <span class="browser__tab-label">{{ tab.title }}</span>
          </button>
          <button type="button" class="browser__tab-close" :aria-label="`关闭 ${tab.title}`" :title="`关闭 ${tab.title}`" @click="removeTab(tab.id)">
            <BrowserIcon name="close" />
          </button>
        </div>
      </div>
      <button type="button" class="browser__icon-button browser__add" @click="addTab" @mousedown.stop @touchstart.stop @dblclick.stop title="新建标签页" aria-label="新建标签页"><BrowserIcon name="plus" /></button>
      <div class="browser__drag-space" aria-hidden="true"></div>
      <button type="button" class="browser__icon-button browser__settings-button" :class="{ 'browser__settings-button--active': showSettings }" @click="openSettings" @mousedown.stop @touchstart.stop @dblclick.stop title="浏览器设置" aria-label="浏览器设置"><BrowserIcon name="settings" /></button>
      <div class="browser__winbtns" @mousedown.stop @touchstart.stop @dblclick.stop>
        <WinUpButtonGroupVue :browser-window="browserWindow" />
      </div>
    </header>

    <BrowserTab
      v-for="tab in tabs"
      :key="tab.id"
      v-show="currentTab === tab.id && !showSettings"
      :id="`browser-panel-${browserWindow.id}-${tab.id}`"
      role="tabpanel"
      :aria-labelledby="`browser-tab-${browserWindow.id}-${tab.id}`"
      :isCurrent="currentTab === tab.id && !showSettings"
      :proxyUrl="proxyEnabled ? proxyUrl : ''"
      @change="updateTab(tab, $event)"
    />

    <section v-if="showSettings" class="browser-settings" :aria-labelledby="settingsId">
      <header class="browser-settings__header">
        <button type="button" class="browser__icon-button" @click="showSettings = false" title="返回网页" aria-label="返回网页"><BrowserIcon name="back" /></button>
        <h1 :id="settingsId">浏览器设置</h1>
      </header>
      <div class="browser-settings__body">
        <form class="browser-settings__form" @submit.prevent="saveSettings">
          <h2>网络代理</h2>
          <div class="browser-settings__row">
            <label :for="settingsId + '-enabled'">启用代理</label>
            <input :id="settingsId + '-enabled'" v-model="draftProxyEnabled" class="browser-settings__switch" type="checkbox" role="switch" />
          </div>
          <label class="browser-settings__field">
            <span>代理地址</span>
            <input v-model="draftProxyUrl" :disabled="!draftProxyEnabled" type="text" placeholder="https://example.com/proxy?url={url}" spellcheck="false" autocomplete="off" :aria-describedby="settingsId + '-help'" />
          </label>
          <p :id="settingsId + '-help'" class="browser-settings__hint">地址中可用 {url} 表示目标网址；不含 {url} 时追加到末尾。</p>
          <p class="browser-settings__hint">部分网站不允许内嵌浏览，可用地址栏右侧按钮在新窗口打开。</p>
          <p v-if="settingsError" class="browser-settings__error" role="alert">{{ settingsError }}</p>
          <div class="browser-settings__actions">
            <button type="button" class="browser-settings__button" @click="showSettings = false" :disabled="savingSettings">取消</button>
            <button type="submit" class="browser-settings__button browser-settings__button--primary" :disabled="savingSettings">{{ savingSettings ? '保存中…' : '保存设置' }}</button>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.browser {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #fff;
  color: #30343b;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
  button, input { font: inherit; }
  button:focus-visible, input:focus-visible { outline: 2px solid #4b82e8; outline-offset: 2px; }
  button:disabled { opacity: .5; cursor: default; }
}
.browser__tabbar {
  display: flex;
  align-items: center;
  height: 43px;
  gap: 5px;
  padding-left: 9px;
  background: #e9edf4;
  user-select: none;
  flex-shrink: 0;
}
.browser__tabs {
  display: flex;
  align-items: flex-end;
  min-width: 0;
  max-width: calc(100% - 191px);
  height: 100%;
  gap: 5px;
  padding-top: 7px;
  box-sizing: border-box;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
.browser__tab {
  display: flex;
  align-items: center;
  width: 182px;
  flex: 0 0 182px;
  height: 35px;
  padding-right: 7px;
  border-radius: 10px 10px 0 0;
  transition: background 120ms;
  &:hover { background: #ffffff80; }
  &--active, &--active:hover { background: #fff; }
}
.browser__tab-select {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  height: 100%;
  flex: 1;
  padding: 0 6px 0 12px;
  border: 0;
  background: transparent;
  color: #636d7b;
  cursor: pointer;
  border-radius: 9px 4px 0 0;
  :deep(svg) { width: 15px; height: 15px; }
}
.browser__tab-label { color: #3d4652; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
.browser__tab-close {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 23px;
  height: 23px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #697281;
  cursor: pointer;
  :deep(svg) { width: 13px; height: 13px; }
  &:hover { background: #dfe5ee; color: #30343b; }
}
.browser__tab-spinner {
  box-sizing: border-box;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border: 2px solid #c9d5eb;
  border-top-color: #4a7bd0;
  border-radius: 50%;
  animation: browser-tab-spin 800ms linear infinite;
}
.browser__icon-button {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #636d7b;
  cursor: pointer;
  flex-shrink: 0;
  &:hover { background: #dce3ed; }
  &:active { background: #cdd8e6; }
}
.browser__drag-space { flex: 1; min-width: 8px; align-self: stretch; }
.browser__settings-button--active { background: #dbe5f5; color: #2c64ba; }
.browser__winbtns { width: 108px; flex-shrink: 0; align-self: stretch; }
.browser-settings {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: #f6f7fa;
  &__header { display: flex; align-items: center; gap: 12px; padding: 14px 22px; background: #fff; border-bottom: 1px solid #e9ecf1; }
  h1 { margin: 0; font-size: 15px; font-weight: 600; }
  h2 { margin: 0 0 25px; font-size: 18px; font-weight: 600; }
  &__body { overflow: auto; flex: 1; min-height: 0; padding: 36px 24px; }
  &__form { max-width: 520px; margin: 0 auto; padding: 27px 28px; border: 1px solid #e4e8ef; border-radius: 14px; background: #fff; }
  &__row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; gap: 15px; font-size: 14px; }
  &__switch {
    appearance: none;
    position: relative;
    box-sizing: border-box;
    width: 36px;
    height: 21px;
    flex-shrink: 0;
    margin: 0;
    border: 0;
    border-radius: 15px;
    background: #c8cfda;
    cursor: pointer;
    transition: background 120ms;
    &::before { content: ''; position: absolute; top: 3px; left: 3px; width: 15px; height: 15px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px #0002; transition: transform 120ms; }
    &:checked { background: #3975dc; }
    &:checked::before { transform: translateX(15px); }
  }
  &__field {
    display: grid;
    gap: 10px;
    font-size: 13px;
    input { box-sizing: border-box; width: 100%; height: 40px; padding: 0 11px; border: 1px solid #d9e0e9; border-radius: 8px; outline: 0; background: #fff; color: #30343b; font-size: 13px; }
    input:focus { border-color: #87aeea; }
    input:disabled { background: #f4f6f9; color: #9ba5b3; }
  }
  &__hint { margin: 12px 0 0; color: #7a8493; font-size: 12px; line-height: 1.7; }
  &__error { margin: 15px 0 0; color: #b43434; font-size: 13px; }
  &__actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 28px; }
  &__button { height: 36px; padding: 0 15px; border: 1px solid #dce2eb; border-radius: 8px; background: #fff; color: #505b6c; font-size: 13px !important; cursor: pointer; }
  &__button:hover { background: #f1f4f8; }
  &__button--primary { background: #3975dc; border-color: #3975dc; color: #fff; }
  &__button--primary:hover { background: #2864cb; }
}
@keyframes browser-tab-spin { to { transform: rotate(360deg); } }
@media (max-width: 480px) {
  .browser__tabbar { padding-left: 5px; gap: 2px; }
  .browser__tabs { max-width: calc(100% - 178px); }
  .browser__tab { width: 142px; flex-basis: 142px; }
  .browser-settings__header { padding: 12px; }
  .browser-settings__body { padding: 20px 12px; }
  .browser-settings__form { padding: 22px 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .browser * { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
</style>
