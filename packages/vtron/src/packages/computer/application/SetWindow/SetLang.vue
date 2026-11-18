<template>
  <SettingsPanel
    :title="i18n('time.and.language')"
    :pages="settingPages('language')"
    v-model="page"
  >
    <template v-if="page === 0">
      <label class="field">
        <span>时区</span>
        <select
          :value="preferences.timeZone ?? ''"
          @change="save('timeZone', ($event.target as HTMLSelectElement).value || undefined)"
        >
          <option value="">跟随浏览器（{{ currentZone }}）</option>
          <option v-for="zone in zones" :key="zone" :value="zone">{{ zone }}</option>
        </select>
      </label>
      <h2>任务栏预览</h2>
      <p>{{ preview.date }} {{ preview.time }}</p>
    </template>
    <template v-else-if="page === 1">
      <label class="field">
        <span>区域格式</span>
        <select
          :value="preferences.region ?? ''"
          @change="save('region', ($event.target as HTMLSelectElement).value || undefined)"
        >
          <option value="">默认</option>
          <option value="zh-CN">中国大陆</option>
          <option value="zh-TW">中国台湾</option>
          <option value="en-US">美国</option>
          <option value="en-GB">英国</option>
          <option value="ja-JP">日本</option>
        </select>
      </label>
      <label class="field">
        <span>日期格式</span>
        <select
          :value="preferences.dateFormat ?? 'short'"
          @change="
            save('dateFormat', ($event.target as HTMLSelectElement).value === 'long' ? 'long' : undefined)
          "
        >
          <option value="short">短日期</option>
          <option value="long">长日期</option>
        </select>
      </label>
      <h2>任务栏预览</h2>
      <p>{{ preview.date }} {{ preview.time }}</p>
    </template>
    <template v-else>
      <label class="field">
        <span>{{ i18n('language') }}</span>
        <select v-model="language">
          <option value="zh-CN">简体中文</option>
          <option value="en-US">English (United States)</option>
        </select>
      </label>
      <button class="action" type="button" @click="submit">{{ i18n('confirm') }}</button>
    </template>
  </SettingsPanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { i18n } from '@/packages/computer/i18n';
import { formatDesktopClock } from '@/packages/computer/utils/desktopClock';
import { settingPages } from './settingPages';
import SettingsPanel from './SettingsPanel.vue';
import { useDesktopPreferences } from './preferences';

const { system, preferences, save } = useDesktopPreferences();
const props = defineProps<{ initialPage?: number }>();
const page = ref(props.initialPage ?? 0);
const language = ref(system.getConfig('lang'));
const currentZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const zones = [
  ...new Set([
    'UTC',
    currentZone,
    ...(Intl.supportedValuesOf?.('timeZone') ?? [
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Europe/London',
      'America/New_York',
      'America/Los_Angeles',
    ]),
  ]),
].sort();
const preview = computed(() => formatDesktopClock(new Date(), preferences.value));

async function submit() {
  await system.setConfig('lang', language.value);
  await system.createDialog().showMessageBox({
    message: i18n('save.success'),
    title: i18n('language'),
    type: 'info',
  });
  system.restart();
}
</script>
