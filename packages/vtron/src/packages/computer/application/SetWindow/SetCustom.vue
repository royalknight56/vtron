<template>
  <SettingsPanel :title="i18n('personalization')" :pages="pages" v-model="page">
    <template v-if="page === 0">
      <label class="field">
        <span>{{ i18n('set.background') }}</span>
        <select v-model="backgroundType">
          <option value="image">{{ i18n('url') }}</option>
          <option value="color">{{ i18n('color') }}</option>
        </select>
      </label>
      <div v-if="backgroundType === 'color'" class="field">
        <ColorPicker v-model="backgroundColor" />
      </div>
      <label v-else class="field">
        <span>背景地址</span>
        <input v-model.trim="backgroundUrl" type="text" placeholder="链接或 Base64 图片" />
      </label>
      <WinButton @click="submit">{{ i18n('confirm') }}</WinButton>
    </template>
    <template v-else-if="page === 1">
      <div class="lock-preview" :style="lockPreviewStyle" role="img" aria-label="锁屏预览">
        <span>{{ lockTime }}</span>
      </div>
      <label class="field">
        <span>锁屏背景</span>
        <select
          :value="preferences.lockScreenColor ?? ''"
          @change="save('lockScreenColor', ($event.target as HTMLSelectElement).value || undefined)"
        >
          <option value="">使用桌面背景</option>
          <option value="#163b5a">深蓝</option>
          <option value="#233f36">深绿</option>
          <option value="#342e45">深紫</option>
        </select>
      </label>
    </template>
    <template v-else-if="page === 2">
      <div class="themes" aria-label="主题">
        <button
          v-for="theme in themes"
          :key="theme.name"
          class="theme"
          type="button"
          :aria-pressed="
            system.getConfig('background') === theme.background &&
            system.getConfig('rootStyle')?.['--theme-main-color'] === theme.taskbar
          "
          :disabled="applyingTheme"
          @click="applyTheme(theme)"
        >
          <span
            class="theme-preview"
            :style="{ background: theme.background, borderColor: theme.taskbar }"
          ></span>
          {{ theme.name }}
        </button>
      </div>
      <h2>{{ i18n('style') }}</h2>
      <label class="field">
        <span>桌面文字颜色</span>
        <ColorPicker v-model="textColor" />
      </label>
      <label class="field">
        <span>任务栏颜色</span>
        <ColorPicker v-model="taskBarColor" />
      </label>
      <label class="field">
        <span>窗口圆角</span>
        <WinInput v-model="winRadius" placeholder="2px" />
      </label>
      <WinButton @click="submitStyle">{{ i18n('confirm') }}</WinButton>
    </template>
    <template v-else-if="page === 3">
      <label class="field">
        <span>在开始菜单中显示磁贴</span>
        <input
          type="checkbox"
          role="switch"
          :checked="preferences.showStartTiles !== false"
          @change="save('showStartTiles', ($event.target as HTMLInputElement).checked)"
        />
      </label>
    </template>
    <template v-else>
      <label class="field">
        <span>在任务栏上显示日期和时间</span>
        <input
          type="checkbox"
          role="switch"
          :checked="preferences.showTaskbarClock !== false"
          @change="save('showTaskbarClock', ($event.target as HTMLInputElement).checked)"
        />
      </label>
      <button class="settings-link" type="button" @click="page = 2">更改任务栏颜色</button>
    </template>
  </SettingsPanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import WinButton from '@packages/components/WinButton.vue';
import WinInput from '@packages/components/WinInput.vue';
import ColorPicker from './components/ColorPicker.vue';
import { settingPages } from './settingPages';
import SettingsPanel from './SettingsPanel.vue';
import { useDesktopPreferences } from './preferences';
import { i18n } from '@/packages/computer/i18n';
import { formatDesktopClock } from '@/packages/computer/utils/desktopClock';

const { system, preferences, save } = useDesktopPreferences();
const pages = settingPages('custom');
const props = defineProps<{ initialPage?: number }>();
const page = ref(props.initialPage ?? 0);
const applyingTheme = ref(false);
const lockPreviewStyle = computed(() => {
  const desktop = system.getConfig('background');
  const custom = preferences.value.lockScreenColor;
  if (custom) return { backgroundColor: custom };
  if (desktop?.startsWith('#')) return { backgroundColor: desktop };
  if (
    desktop &&
    /^(https?:|data:image\/)/i.test(desktop) &&
    (desktop.startsWith('data:') || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(desktop))
  ) {
    return { backgroundImage: 'url(' + JSON.stringify(desktop) + ')' };
  }
  return {};
});
const lockTime = computed(() => formatDesktopClock(new Date(), preferences.value).time);
const themes = [
  { name: '海蓝', background: '#65b8e0', taskbar: '#ededed', text: '#111111' },
  { name: '深蓝', background: '#163b5a', taskbar: '#c8dbe9', text: '#ffffff' },
  { name: '沙色', background: '#dfc9aa', taskbar: '#f0e5d5', text: '#282018' },
];
const initialBackground = system.getConfig('background') ?? '';
const backgroundType = ref(initialBackground && !initialBackground.startsWith('#') ? 'image' : 'color');
const backgroundColor = ref(initialBackground.startsWith('#') ? initialBackground : '#ffffff');
const backgroundUrl = ref(initialBackground.startsWith('#') ? '' : initialBackground);
const textColor = ref(system.getConfig('rootStyle')?.['--icon-title-color'] || '#111');
const taskBarColor = ref(system.getConfig('rootStyle')?.['--theme-main-color'] || '#ededed');
const winRadius = ref(system.getConfig('rootStyle')?.['--window-border-radius']);

async function submit() {
  const value = backgroundType.value === 'color' ? backgroundColor.value : backgroundUrl.value.trim();
  if (!value) return;
  await system.setConfig('background', value);
  system
    .createDialog()
    .showMessageBox({ message: i18n('save.success'), title: i18n('wallpaper'), type: 'info' });
}

async function applyTheme(theme: (typeof themes)[number]) {
  applyingTheme.value = true;
  backgroundType.value = 'color';
  backgroundColor.value = theme.background;
  taskBarColor.value = theme.taskbar;
  textColor.value = theme.text;
  try {
    await system.setConfig('background', theme.background);
    await writeStyle();
  } catch {
    system.createDialog().showMessageBox({ title: '主题', message: '无法保存主题。', type: 'error' });
  } finally {
    applyingTheme.value = false;
  }
}

function writeStyle() {
  return system.setConfig('rootStyle', {
    ...system.getConfig('rootStyle'),
    '--icon-title-color': textColor.value,
    '--window-border-radius': winRadius.value,
    '--theme-main-color': taskBarColor.value,
  });
}

async function submitStyle() {
  await writeStyle();
  system.createDialog().showMessageBox({ message: i18n('save.success'), title: i18n('style'), type: 'info' });
}
</script>

<style scoped>
.lock-preview {
  display: flex;
  align-items: end;
  width: min(100%, 320px);
  aspect-ratio: 16 / 9;
  box-sizing: border-box;
  margin-bottom: 18px;
  padding: 14px;
  background: #3a536a center / cover;
  box-shadow: inset 0 -60px 60px -34px #0009;
  color: white;
  font-size: 32px;
  text-shadow: 0 1px 4px #000;
}
.themes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.theme {
  width: 98px;
  padding: 4px;
  border: 2px solid transparent;
  background: #f0f0f0;
  color: inherit;
  font: inherit;
}
.theme:hover {
  border-color: #aaa;
}
.theme[aria-pressed='true'] {
  border-color: #0078d7;
}
.theme-preview {
  display: block;
  height: 46px;
  border-bottom: 8px solid;
  margin-bottom: 4px;
}
</style>
