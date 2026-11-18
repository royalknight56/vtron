<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="window-outer"
    :class="{
      focus: focusState && currentRouter !== 'main',
    }"
  >
    <div class="upbar" v-dragable>
      <div class="upbar-left">
        <button
          class="back-arr"
          v-if="currentRouter !== 'main'"
          type="button"
          :aria-label="i18n('windows.setting')"
          @click="back"
        >
          ←
        </button>
        <div class="upbar-text">
          {{ i18n('setting') }}
        </div>
      </div>
      <div class="upbar-right">
        <WinUpButtonGroup :browser-window="browserWindow"></WinUpButtonGroup>
      </div>
    </div>
    <Transition name="fade" mode="out-in" appear>
      <component v-if="activePanel" :is="activePanel.content" :key="activePanel.key" />
      <div v-else class="outer">
        <h1 class="settings-title">{{ i18n('windows.setting') }}</h1>
        <div class="main_uper">
          <button
            v-for="item in setList"
            :key="item.key"
            class="set_item"
            type="button"
            @click="openSet(item.key)"
            v-glowing="{ color: '#3c3c3ce4', scale: 0.6 }"
          >
            <span class="set_item-img">
              <span v-if="item.glyph" class="SEGOEUIMDL" aria-hidden="true">{{ item.glyph }}</span>
              <img v-else :src="item.icon" alt="" />
            </span>
            <span class="set_item-right">
              <span class="set_item-title">{{ item.title }}</span>
              <span class="set_item-desc">{{ item.desc }}</span>
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
<script lang="ts" setup>
import { computed, defineComponent, h, inject, ref, markRaw } from 'vue';
import SetCustom from '@/packages/computer/application/SetWindow/SetCustom.vue';
import SetSystem from '@/packages/computer/application/SetWindow/SetSystem.vue';
import SetLang from '@/packages/computer/application/SetWindow/SetLang.vue';
import SetAccount from '@/packages/computer/application/SetWindow/SetAccount.vue';
import SetWeb, { type WebSettingsCategory } from './SetWindow/SetWeb.vue';
import type { Setting } from '@/packages/type/type';

import WinUpButtonGroup from '@/packages/components/WinUpButtonGroup.vue';
import e7f8 from '@/assets/icon/e7f8.png'; //系统设置
import e771 from '@/assets/icon/e771.png'; //个性化
import e775 from '@/assets/icon/e775.png'; //语言
import e77b from '@/assets/icon/e77b.png'; //账户

import { vDragable } from '@/packages/computer/layout/windowGroup/MakeDragable';

import { i18n } from '@/packages/computer/i18n';
import { BrowserWindow } from '@/packages/services';
import { System } from '@packages/kernel';

import { vGlowing } from '@/packages/computer/utils/glowingBorder';

const browserWindow = inject<BrowserWindow>('browserWindow')!;
const sys = inject<System>('system')!;

const currentRouter = ref(browserWindow.config?.router || 'main');

const focusState = ref(false);
browserWindow?.on('focus', () => {
  focusState.value = true;
});
browserWindow?.on('blur', () => {
  focusState.value = false;
});
function back() {
  currentRouter.value = 'main';
}
function openSet(key: string) {
  currentRouter.value = key;
}
function webSetting(key: WebSettingsCategory, title: string, desc: string, glyph: string): Setting {
  return {
    key,
    title,
    desc,
    glyph,
    icon: '',
    content: markRaw(defineComponent(() => () => h(SetWeb, { category: key }))),
  };
}
const webSettings = [
  webSetting('devices', '设备', '音频和视频设备', '\uE772'),
  webSetting('phone', '手机', '在手机上使用 Vtron', '\uE8EA'),
  webSetting('network', '网络和 Internet', '网络状态', '\uE774'),
  webSetting('gaming', '游戏', '全屏显示', '\uE7FC'),
  webSetting('accessibility', '轻松使用', '放大镜、屏幕键盘', '\uE776'),
  webSetting('search', '搜索', '文件和文件夹', '\uE721'),
  webSetting('privacy', '隐私', '站点权限', '\uE72E'),
];
const order = [
  'system',
  'devices',
  'phone',
  'network',
  'custom',
  'account',
  'language',
  'gaming',
  'accessibility',
  'search',
  'privacy',
  '备份与恢复',
];

const setList = computed<Setting[]>(() => {
  const customSettings = sys.stateManager.settings.getSettings();
  const features = sys._options.builtinFeature;
  const panels = [
    {
      key: 'system',
      title: i18n('system'),
      desc: '显示、声音、通知、存储、关于',
      icon: e7f8,
      content: markRaw(SetSystem),
    },
    ...webSettings.filter(({ key }) => {
      if (key === 'phone') return Boolean(sys.getConfig('mobileDemoUrl'));
      if (key === 'accessibility') return Boolean(sys.stateManager.windowMap.get('Menulist', '放大镜'));
      return true;
    }),
    ...(features?.includes('Setting-Personalization')
      ? [
          {
            key: 'custom',
            title: i18n('personalization'),
            desc: '背景、锁屏、主题、开始菜单、任务栏',
            icon: e771,
            content: markRaw(SetCustom),
          },
        ]
      : []),
    ...(features?.includes('Setting-Language')
      ? [
          {
            key: 'language',
            title: i18n('time.and.language'),
            desc: '时区、区域、语言',
            icon: e775,
            content: markRaw(SetLang),
          },
        ]
      : []),
    ...(features?.includes('Setting-Account') && !customSettings.some(({ key }) => key === 'account')
      ? [
          {
            key: 'account',
            title: i18n('account'),
            desc: i18n('your.account'),
            icon: e77b,
            content: markRaw(SetAccount),
          },
        ]
      : []),
    ...customSettings,
  ];
  const position = (key: string) => (order.includes(key) ? order.indexOf(key) : order.length);
  return panels.sort((a, b) => position(a.key) - position(b.key));
});
const activePanel = computed(() => setList.value.find((item) => item.key === currentRouter.value));
</script>

<style lang="scss" scoped>
@import '@packages/main.css';

.window-outer {
  --settings-sidebar-width: 200px;
  background-color: white;
  width: 100%;
  height: 100%;
  border: #0076d795 1px solid;
  box-sizing: border-box;
  // box-shadow: inset -599px 0px 0px 0px #ffffff;
  transition: background-color 0.1s;
  overflow: hidden;
}

.window-outer.focus {
  background-color: rgba(255, 255, 255, 0.704);
  backdrop-filter: blur(10px);
}

.upbar {
  height: 40px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;

  .upbar-left {
    display: flex;
    align-items: center;
    font-size: 12px;
    height: 100%;

    .back-arr {
      padding: 0 6px;
      border: 0;
      background: transparent;
      color: inherit;
      margin-right: 3px;
      font-size: 14px;
      width: 40px;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .back-arr:hover {
      color: var(--color-ui-gray);
      background-color: var(--color-dark);
    }

    .upbar-text {
      font-size: 14px;
      margin-left: 10px;
    }
  }

  .upbar-right {
    width: calc(100% - var(--settings-sidebar-width));
    display: flex;
    justify-content: flex-end;
    height: 100%;
    background-color: white;
  }
}

.outer {
  height: calc(100% - 40px);
  overflow: auto;
  background: white;
}

.settings-title {
  margin: 22px 18px 20px;
  text-align: center;
  font-size: 24px;
  font-weight: 400;
}

.main_uper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 174px), 1fr));
  gap: 8px;
  max-width: 980px;
  margin: 0 auto;
  padding: 0 20px 20px;
}

.set_item {
  min-width: 0;
  min-height: 76px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 8px;
  background: white;
  border: 1px solid transparent;
  color: inherit;
  font: inherit;
  text-align: left;
}

.set_item:hover {
  border-color: #999;
}

.set_item-img {
  width: 28px;
  flex-shrink: 0;
  color: #0078d7;
  font-size: 24px;
  text-align: center;
}

.set_item-img img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.set_item-title {
  display: block;
  font-size: 14px;
  line-height: 1.3;
}

.set_item-desc {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #595959;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}

.fade-leave-active {
  pointer-events: none;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
