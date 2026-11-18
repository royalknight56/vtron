<template>
  <section class="search-panel" @click.stop>
    <div v-if="results.length" ref="list" role="listbox" :id="listId" :aria-label="i18n('startMenu.query')">
      <template v-for="(result, index) in results" :key="result.key">
        <h3 v-if="index === 0">{{ i18n('startMenu.best') }}</h3>
        <h3 v-else-if="index === 1 || result.kind !== results[index - 1].kind">{{ kinds[result.kind] }}</h3>
        <button
          type="button"
          role="option"
          tabindex="-1"
          :id="listId + '-' + index"
          :aria-selected="index === selected"
          @mousedown.prevent
          @click="open(result)"
          @contextmenu.prevent="contextMenu($event, result)"
        >
          <span class="result-icon">
            <span v-if="result.kind === 'setting'" class="SEGOEUIMDL" aria-hidden="true">&#xE713;</span>
            <FileIcon v-else :icon="result.app?.icon" :file="result.file" />
          </span>
          <span class="result-text"
            ><strong>{{ result.name }}</strong
            ><small>{{ result.detail }}</small></span
          >
        </button>
      </template>
    </div>
    <p role="status" v-if="error || (!results.length && query)">
      {{ error || i18n(busy ? 'startMenu.loading' : 'startMenu.empty') }}
    </p>
  </section>
</template>
<script setup lang="ts">
import { computed, inject, nextTick, ref, shallowRef, watch } from 'vue';
import type { System, VtronFileWithoutContent } from '@packages/kernel';
import type { WinAppOptionsApp } from '@/packages/type/type';
import { i18n } from '../../../i18n';
import FileIcon from '../../../application/FileIcon.vue';
import { getSettingPanels } from '../../../application/settingPanels';
import { settingPages } from '../../../application/SetWindow/settingPages';
import { openSettings } from '../../../utils/openSettings';
import { openRegisteredApp } from '../../../utils/openRegisteredApp';
import { pinAction } from '../../../utils/taskbarPins';

const props = defineProps<{ query: string; listId: string }>();
const emit = defineEmits<{ (event: 'select', id?: string): void }>();
const sys = inject<System>('system')!;
const kinds = { app: i18n('startMenu.apps'), setting: i18n('setting'), file: i18n('startMenu.files') };
type Result = {
  key: string;
  name: string;
  kind: keyof typeof kinds;
  detail: string;
  keywords?: string;
  app?: WinAppOptionsApp;
  file?: VtronFileWithoutContent;
  router?: string;
  page?: number;
};
const files = shallowRef<VtronFileWithoutContent[]>([]);
const busy = ref(false);
const error = ref('');
const selected = ref(0);
const list = ref<HTMLElement>();
const settingsApp = computed(() => sys.stateManager.windowMap.get('Builtin', '设置'));
const aliases: Record<string, string> = {
  'custom:0': '壁纸 wallpaper',
  'language:0': '时区',
  'language:1': '日期格式',
  'system:0': '亮度',
  'system:1': '音量',
};
const catalog = computed(() => {
  const items: Result[] = [];
  for (const [key, app] of sys.stateManager.windowMap.launchers) {
    items.push({ kind: 'app', key, name: app.name, keywords: app.window.title, detail: kinds.app, app });
  }
  for (const panel of settingsApp.value ? getSettingPanels(sys) : []) {
    items.push({
      key: 'setting:' + panel.key,
      kind: 'setting',
      name: panel.title,
      router: panel.key,
      detail: kinds.setting,
      keywords: settingPages(panel.key).length ? '' : panel.desc,
    });
    settingPages(panel.key).forEach((name, page) => {
      const id = panel.key + ':' + page;
      items.push({
        key: 'setting:' + id,
        kind: 'setting',
        name,
        page,
        router: panel.key,
        keywords: aliases[id],
        detail: kinds.setting + ' › ' + panel.title,
      });
    });
  }
  return items;
});
const results = computed(() => {
  const q = props.query.trim().toLocaleLowerCase();
  if (!q) return [];
  const candidates = [
    ...catalog.value,
    ...files.value.map(
      (file): Result => ({
        key: file.path,
        kind: 'file',
        name: file.name,
        file,
        detail: file.path,
      })
    ),
  ];
  function rank(item: Result) {
    const name = item.name.toLocaleLowerCase();
    if (name === q) return 0;
    if (name.startsWith(q)) return 1;
    if (name.includes(q)) return 2;
    return item.keywords?.toLocaleLowerCase().includes(q) ? 3 : 4;
  }
  const matches = candidates.filter((item) => rank(item) < 4).sort((a, b) => rank(a) - rank(b));
  const [best, ...rest] = matches;
  return best
    ? [
        best,
        ...(['app', 'setting', 'file'] as const).flatMap((kind) => rest.filter((item) => item.kind === kind)),
      ]
    : [];
});
watch(
  () => props.query.trim(),
  (query, _, cleanup) => {
    selected.value = 0;
    files.value = [];
    error.value = '';
    busy.value = !!query;
    if (!query) return;
    let current = true;
    const timer = setTimeout(async () => {
      try {
        const matches = await sys.fs.search(query, 'contains');
        const user = sys._options.userLocation;
        if (current)
          files.value = matches.filter(
            (file) =>
              !file.name.startsWith('.') &&
              !file.name.endsWith('.exe') &&
              !file.path.startsWith(sys._options.systemLocation || '/C/System/') &&
              !['RecycleBin', 'Menulist', 'Magnet'].some((dir) => file.path.startsWith(user + dir + '/'))
          );
      } catch {
        if (current) error.value = i18n('startMenu.searchError');
      } finally {
        if (current) busy.value = false;
      }
    }, 120);
    cleanup(() => {
      current = false;
      clearTimeout(timer);
    });
  },
  { immediate: true }
);
watch(
  () => results.value[selected.value]?.key,
  (key) => emit('select', key ? props.listId + '-' + selected.value : undefined),
  { immediate: true }
);
function move(delta: number) {
  selected.value = Math.max(0, Math.min(results.value.length - 1, selected.value + delta));
  nextTick(() => list.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }));
}
function open(result?: Result) {
  if (!result) return;
  sys.emitEvent('uipop.hidden');
  if (result.app) return openRegisteredApp(sys, result.app);
  if (result.file) return sys.openFile(result.file.path);
  openSettings(sys, result.router, result.page);
}
function contextMenu(event: MouseEvent, result: Result) {
  if (result.app) sys.buildFromTemplate([pinAction(sys, result.key)]).popup(event);
}
defineExpose({ move, openSelected: () => open(results.value[selected.value]) });
</script>
<style scoped>
.search-panel {
  width: min(440px, 100%);
  max-height: min(440px, calc(100dvh - var(--task-bar-height)));
  height: 410px;
  overflow: auto;
  background: #fafafa;
  color: #202020;
  box-sizing: border-box;
  box-shadow: 0 0 12px #0003;
}
h3,
p {
  font-size: 14px;
  margin: 0;
  padding: 14px 16px 8px;
}
button {
  width: 100%;
  min-height: 54px;
  padding: 6px 16px;
  border: 0;
  display: flex;
  align-items: center;
  gap: 13px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
}
button:hover {
  background: #e7e7e7;
}
button[aria-selected='true'] {
  background: #cce4f7;
  box-shadow: inset 3px 0 #0078d7;
}
.result-icon {
  width: 28px;
  height: 28px;
  flex: none;
  display: grid;
  place-items: center;
  font-size: 22px;
}
.result-text {
  min-width: 0;
}
strong,
small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
}
strong {
  font-size: 15px;
}
small {
  color: #525252;
  font-size: 12px;
}
</style>
