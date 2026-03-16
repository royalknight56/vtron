<template>
  <div class="browser">
    <div class="browser__tabbar" v-dragable @dblclick="handleDbclick">
      <div class="browser__tabs">
        <div
          class="browser__tab"
          :class="{ 'browser__tab--active': currentTab === '主页' }"
          @click="switchTab('主页')"
        >
          <span class="browser__tab-icon segoicon SEGOEUIMDL">&#xE80F;</span>
          <span class="browser__tab-label">主页</span>
        </div>
        <div
          class="browser__tab"
          v-for="item in tabs"
          :key="item"
          :class="{ 'browser__tab--active': currentTab === item }"
          @click="switchTab(item)"
        >
          <span class="browser__tab-icon segoicon SEGOEUIMDL">&#xE774;</span>
          <span class="browser__tab-label">{{ item }}</span>
          <div class="browser__tab-close" @click.stop="removeTab(item)">
            <span class="segoicon SEGOEUIMDL">&#xE711;</span>
          </div>
        </div>
        <button class="browser__add" @click="addTab" title="新建标签页">
          <span class="segoicon SEGOEUIMDL">&#xE710;</span>
        </button>
      </div>
      <button class="browser__settings-btn" @click="showSettings = true" title="设置">
        <span class="segoicon SEGOEUIMDL">&#xE713;</span>
      </button>
      <div class="browser__winbtns">
        <WinUpButtonGroupVue :browser-window="browserWindow" />
      </div>
    </div>

    <BrowserTab
      key="主页"
      v-show="currentTab === '主页' && !showSettings"
      :isCurrent="currentTab === '主页'"
      :proxyUrl="proxyEnabled ? proxyUrl : ''"
    />
    <BrowserTab
      v-for="item in tabs"
      :key="item"
      v-show="currentTab === item && !showSettings"
      :isCurrent="currentTab === item"
      :proxyUrl="proxyEnabled ? proxyUrl : ''"
    />

    <!-- Settings Page -->
    <div v-if="showSettings" class="browser__settings">
      <div class="settings">
        <div class="settings__header">
          <button class="settings__back" @click="showSettings = false">
            <span class="segoicon SEGOEUIMDL">&#xE72B;</span>
          </button>
          <span class="settings__title">设置</span>
        </div>
        <div class="settings__body">
          <div class="settings__section">
            <div class="settings__section-title">网络代理</div>
            <div class="settings__section-desc">
              通过代理服务加载网页，可解决部分网站无法在 iframe 中加载的问题。
            </div>

            <div class="settings__field">
              <label class="settings__label">启用代理</label>
              <div class="settings__toggle" :class="{ 'settings__toggle--on': proxyEnabled }" @click="proxyEnabled = !proxyEnabled">
                <div class="settings__toggle-thumb"></div>
              </div>
            </div>

            <div class="settings__field">
              <label class="settings__label">代理地址</label>
              <input
                class="settings__input"
                v-model="proxyUrl"
                placeholder="例如: https://proxy.example.com/?url="
                :disabled="!proxyEnabled"
                spellcheck="false"
              />
            </div>

            <div class="settings__hint">
              <p>代理地址会拼接在目标 URL 前面。例如：</p>
              <code v-if="proxyUrl">{{ proxyUrl }}https://example.com</code>
              <code v-else>https://proxy.example.com/?url=https://example.com</code>
              <p style="margin-top: 8px;">如果代理地址包含 <code>{url}</code>，则会替换为目标地址：</p>
              <code>https://proxy.example.com/get?url={url}&amp;type=html</code>
            </div>
          </div>

          <div class="settings__section">
            <div class="settings__section-title">常用代理服务</div>
            <div class="settings__presets">
              <div
                class="settings__preset"
                v-for="p in proxyPresets"
                :key="p.url"
                @click="applyPreset(p.url)"
              >
                <span class="settings__preset-name">{{ p.name }}</span>
                <span class="settings__preset-url">{{ p.url }}</span>
              </div>
            </div>
          </div>

          <div class="settings__actions">
            <button class="settings__btn settings__btn--primary" @click="saveSettings">保存设置</button>
            <button class="settings__btn" @click="showSettings = false">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject, onMounted, ref } from 'vue';
import { BrowserWindow, System, vDragable, WinUpButtonGroupVue, join } from 'vtron';
import BrowserTab from './Browser/BrowserTab.vue';

const browserWindow = inject<BrowserWindow>('browserWindow')!;
const sys = inject<System>('system')!;

const tabs = ref<string[]>([]);
const currentTab = ref('主页');
let tabCounter = 0;

const showSettings = ref(false);
const proxyUrl = ref('');
const proxyEnabled = ref(false);

const SETTINGS_PATH = join(sys._options.userLocation || '', 'Config', 'browser.json');

const proxyPresets = [
  { name: 'AllOrigins', url: 'https://api.allorigins.win/raw?url=' },
  { name: 'CORS Proxy', url: 'https://corsproxy.io/?' },
  { name: 'CORS Anywhere', url: 'https://cors-anywhere.herokuapp.com/' },
];

function applyPreset(url: string) {
  proxyUrl.value = url;
  proxyEnabled.value = true;
}

async function loadSettings() {
  try {
    const raw = await sys.fs.readFile(SETTINGS_PATH);
    if (raw) {
      const cfg = JSON.parse(raw);
      proxyUrl.value = cfg.proxyUrl || '';
      proxyEnabled.value = !!cfg.proxyEnabled;
    }
  } catch {
    // no saved settings
  }
}

async function saveSettings() {
  try {
    const dir = join(sys._options.userLocation || '', 'Config');
    try { await sys.fs.mkdir(dir); } catch { /* exists */ }
    await sys.fs.writeFile(
      SETTINGS_PATH,
      JSON.stringify({ proxyUrl: proxyUrl.value, proxyEnabled: proxyEnabled.value }),
    );
    sys.createNotify({ title: '浏览器', content: '设置已保存' });
  } catch {
    sys.createNotify({ title: '浏览器', content: '保存设置失败' });
  }
  showSettings.value = false;
}

function addTab() {
  const name = '新标签页 ' + ++tabCounter;
  tabs.value.push(name);
  currentTab.value = name;
}

function removeTab(tab: string) {
  const idx = tabs.value.indexOf(tab);
  if (idx === -1) return;
  tabs.value.splice(idx, 1);
  if (currentTab.value === tab) {
    currentTab.value = tabs.value[idx - 1] ?? tabs.value[idx] ?? '主页';
  }
}

function switchTab(tab: string) {
  currentTab.value = tab;
}

function handleDbclick() {
  if (browserWindow.isMaximized()) {
    browserWindow.unmaximize();
  } else {
    browserWindow.maximize();
  }
}

onMounted(() => {
  loadSettings();
});
</script>

<style scoped lang="scss">
.browser {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #fff;
}

.browser__tabbar {
  display: flex;
  align-items: flex-end;
  height: 38px;
  background: #dee1e6;
  padding-left: 10px;
  user-select: none;
  flex-shrink: 0;
}

.browser__tabs {
  display: flex;
  align-items: flex-end;
  flex: 1;
  min-width: 0;
  height: 100%;
  gap: 1px;
  overflow: hidden;
  padding-top: 6px;
}

.browser__tab {
  display: flex;
  align-items: center;
  height: 30px;
  max-width: 220px;
  min-width: 48px;
  padding: 0 6px 0 10px;
  background: rgba(255, 255, 255, 0.45);
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  gap: 6px;
  transition: background 0.15s;
  flex-shrink: 1;
  flex-basis: 180px;

  &--active {
    background: #fff;
  }

  &:hover:not(&--active) {
    background: rgba(255, 255, 255, 0.7);
  }
}

.browser__tab-icon {
  font-size: 12px;
  color: #5f6368;
  flex-shrink: 0;
}

.browser__tab-label {
  font-size: 12px;
  color: #3c4043;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.browser__tab-close {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.15s;

  .segoicon {
    font-size: 9px;
    color: #5f6368;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.12);
  }
}

.browser__add {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  margin: 0 4px;
  align-self: center;
  transition: background 0.15s;

  .segoicon {
    font-size: 12px;
    color: #5f6368;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }
}

.browser__settings-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  align-self: center;
  margin-right: 4px;
  transition: background 0.15s;

  .segoicon {
    font-size: 13px;
    color: #5f6368;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }
}

.browser__winbtns {
  width: 100px;
  flex-shrink: 0;
  align-self: stretch;
}

// ── Settings Page ──
.browser__settings {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.settings {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;

  &__header {
    display: flex;
    align-items: center;
    height: 48px;
    padding: 0 16px;
    gap: 12px;
    background: #fff;
    border-bottom: 1px solid #e8eaed;
    flex-shrink: 0;
  }

  &__back {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    border-radius: 50%;
    cursor: pointer;
    color: #5f6368;
    transition: background 0.15s;

    .segoicon { font-size: 14px; }
    &:hover { background: #f1f3f4; }
  }

  &__title {
    font-size: 16px;
    font-weight: 500;
    color: #202124;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;

    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-thumb { background: #c4c7cc; border-radius: 3px; }
  }

  &__section {
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e8eaed;
    padding: 20px;
    margin-bottom: 16px;
  }

  &__section-title {
    font-size: 14px;
    font-weight: 600;
    color: #202124;
    margin-bottom: 4px;
  }

  &__section-desc {
    font-size: 12px;
    color: #5f6368;
    margin-bottom: 16px;
    line-height: 1.5;
  }

  &__field {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__label {
    font-size: 13px;
    color: #3c4043;
    min-width: 64px;
    flex-shrink: 0;
  }

  &__input {
    flex: 1;
    height: 34px;
    padding: 0 12px;
    border: 1px solid #dadce0;
    border-radius: 6px;
    font-size: 13px;
    color: #202124;
    background: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      border-color: #1a73e8;
      box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.15);
    }

    &:disabled {
      background: #f1f3f4;
      color: #9aa0a6;
      cursor: not-allowed;
    }

    &::placeholder { color: #9aa0a6; }
  }

  &__toggle {
    width: 36px;
    height: 20px;
    background: #9aa0a6;
    border-radius: 10px;
    cursor: pointer;
    position: relative;
    transition: background 0.2s;

    &--on {
      background: #1a73e8;
    }
  }

  &__toggle-thumb {
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: left 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

    .settings__toggle--on & {
      left: 18px;
    }
  }

  &__hint {
    margin-top: 12px;
    padding: 12px;
    background: #f1f3f4;
    border-radius: 6px;
    font-size: 12px;
    color: #5f6368;
    line-height: 1.6;

    p { margin: 0 0 4px; }

    code {
      display: block;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 11px;
      color: #1a73e8;
      background: #e8f0fe;
      padding: 6px 10px;
      border-radius: 4px;
      word-break: break-all;
      margin-top: 4px;
    }
  }

  &__presets {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__preset {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border: 1px solid #e8eaed;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: #e8f0fe;
      border-color: #1a73e8;
    }
  }

  &__preset-name {
    font-size: 13px;
    font-weight: 500;
    color: #202124;
  }

  &__preset-url {
    font-size: 11px;
    color: #5f6368;
    font-family: 'Consolas', 'Courier New', monospace;
  }

  &__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding-top: 8px;
  }

  &__btn {
    height: 34px;
    padding: 0 20px;
    border: 1px solid #dadce0;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    background: #fff;
    color: #3c4043;
    transition: all 0.15s;

    &:hover { background: #f1f3f4; }

    &--primary {
      background: #1a73e8;
      color: #fff;
      border-color: #1a73e8;
      &:hover { background: #1557b0; }
    }
  }
}
</style>
