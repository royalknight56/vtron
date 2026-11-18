<template>
  <Transition name="center-slide">
    <aside
      v-if="notifications.center.open"
      ref="panel"
      tabindex="-1"
      :aria-label="i18n('center.title')"
      class="message-center"
      @mousedown.stop
      @keydown.esc.stop.prevent="escape"
    >
      <header v-if="hasSettings">
        <button type="button" class="link" @click="settings('system', 2)">{{ i18n('center.manage') }}</button>
      </header>
      <NotifyCenter />
      <footer>
        <button type="button" class="link expand" :aria-expanded="expanded" @click="expanded = !expanded">
          {{ i18n(expanded ? 'center.collapse' : 'center.expand') }}
        </button>
        <div class="tiles">
          <button
            v-for="action in visibleActions"
            :key="action.glyph"
            type="button"
            class="tile"
            :aria-pressed="action.pressed"
            :title="action.title"
            @click="action.run"
          >
            <span class="SEGOEUIMDL" aria-hidden="true">{{ action.glyph }}</span
            >{{ action.label }}
          </button>
        </div>
        <label v-if="expanded" class="brightness" :title="i18n('brightness') + ' ' + brightness + '%'">
          <span class="SEGOEUIMDL" aria-hidden="true">&#xE706;</span>
          <input
            type="range"
            min="30"
            max="100"
            :value="brightness"
            :aria-label="i18n('brightness')"
            :aria-valuetext="brightness + '%'"
            :style="{ '--level': ((brightness - 30) / 70) * 100 + '%' }"
            @input="previewBrightness"
            @change="saveBrightness"
          />
        </label>
      </footer>
    </aside>
  </Transition>
</template>
<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from 'vue';
import { useDesktopPreferences } from '../../../application/SetWindow/preferences';
import { i18n } from '../../../i18n';
import { openSettings } from '../../../utils/openSettings';
import { openRegisteredApp } from '../../../utils/openRegisteredApp';
import NotifyCenter from './components/NotifyCenter.vue';

const { system: sys, preferences, save } = useDesktopPreferences();
const notifications = sys.stateManager.notify;
const apps = sys.stateManager.windowMap;
const hasSettings = computed(() => !!apps.get('Builtin', '设置'));
const expanded = ref(true);
const panel = ref<HTMLElement>();
const brightness = computed(() => sys.getConfig('brightness') ?? 100);
function previewBrightness(event: Event) {
  sys.stateManager.options.setOptions('brightness', (event.target as HTMLInputElement).valueAsNumber);
}
async function saveBrightness() {
  try {
    await sys.setConfig('brightness', brightness.value);
  } catch {
    sys
      .createDialog()
      .showMessageBox({ title: i18n('brightness'), message: i18n('center.brightnessError'), type: 'error' });
  }
}
function hide() {
  notifications.setOpen(false);
}
function toggle() {
  notifications.setOpen(!notifications.center.open);
  if (notifications.center.open) nextTick(() => panel.value?.focus({ preventScroll: true }));
}
function escape() {
  hide();
  sys.rootRef?.querySelector<HTMLButtonElement>('.action-center-button')?.focus();
}
function settings(router = 'main', page = 0) {
  hide();
  openSettings(sys, router, page);
}
const actions = computed(() => {
  const items: { label: string; glyph: string; pressed?: boolean; title?: string; run: () => void }[] = [];
  if (hasSettings.value)
    items.push({ label: i18n('center.network'), glyph: '\uE774', run: () => settings('network') });
  items.push({
    label: i18n(preferences.value.alarmsOnly ? 'center.alarms' : 'center.focus'),
    glyph: '\uE708',
    pressed: !!preferences.value.alarmsOnly,
    title: i18n('center.focusHint'),
    run: () => save('alarmsOnly', !preferences.value.alarmsOnly),
  });
  for (const [name, key, glyph] of [
    ['便笺', 'center.note', '\uE70B'],
    ['截图工具', 'center.snip', '\uE8C6'],
  ] as const) {
    const app = apps.get('Menulist', name);
    if (app && app.type !== 'group')
      items.push({
        label: i18n(key),
        glyph,
        run: () => {
          hide();
          openRegisteredApp(sys, app);
        },
      });
  }
  if (hasSettings.value)
    items.push(
      { label: i18n('center.settings'), glyph: '\uE713', run: () => settings() },
      { label: i18n('center.devices'), glyph: '\uE772', run: () => settings('devices') },
      { label: i18n('center.sound'), glyph: '\uE767', run: () => settings('system', 1) }
    );
  return items;
});
const visibleActions = computed(() => (expanded.value ? actions.value : actions.value.slice(0, 4)));
sys.mountEvent('messagecenter.show', toggle);
sys.mountEvent('messagecenter.hidden', hide);
onUnmounted(() => {
  hide();
  sys.offEvent('messagecenter.show', toggle);
  sys.offEvent('messagecenter.hidden', hide);
});
</script>
<style scoped>
.message-center {
  position: absolute;
  inset: 0 0 0 auto;
  z-index: 400;
  width: min(360px, 100%);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid #0002;
  box-shadow: -4px 0 18px #0002;
  background: rgba(243, 243, 243, 0.94);
  backdrop-filter: blur(24px);
  color: #171717;
  font:
    14px/1.4 'Segoe UI',
    'Microsoft YaHei UI',
    sans-serif;
  outline: 0;
}
header {
  text-align: right;
  padding: 11px 16px 6px;
}
button {
  color: inherit;
  font: inherit;
  cursor: pointer;
  border: none;
  border-radius: 0;
}
.link {
  background: transparent;
  color: #0067b8;
  padding: 2px 0;
  font-size: 13px;
}
.link:hover {
  color: #222;
}
footer {
  padding: 2px 8px 8px;
  max-height: 55%;
  overflow: auto;
  box-sizing: border-box;
  flex: none;
}
.expand {
  margin: 4px 4px 7px;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
}
.tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 58px;
  text-align: left;
  padding: 7px 8px 5px;
  background: rgba(0, 0, 0, 0.105);
  font-size: 12px;
}
.tile[aria-pressed='true'] {
  background: #0078d7;
  color: white;
}
.tile:hover {
  background: rgba(0, 0, 0, 0.15);
  outline: 1px solid #888;
  outline-offset: -1px;
}
.tile[aria-pressed='true']:hover {
  background: #0067b8;
}
.tile .SEGOEUIMDL,
.brightness span {
  font-size: 17px;
  line-height: 1.2;
}
.brightness {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 8px 4px;
}
.brightness input {
  flex: 1;
  min-width: 0;
  appearance: none;
  background: transparent;
  height: 26px;
  margin: 0;
  accent-color: #0078d7;
}
.brightness input::-webkit-slider-runnable-track {
  height: 2px;
  background: linear-gradient(to right, #0078d7 var(--level), #888 var(--level));
}
.brightness input::-webkit-slider-thumb {
  appearance: none;
  width: 8px;
  height: 22px;
  margin-top: -10px;
  border-radius: 4px;
  background: #0078d7;
}
.brightness input::-moz-range-track {
  height: 2px;
  background: #888;
}
.brightness input::-moz-range-progress {
  background: #0078d7;
}
.brightness input::-moz-range-thumb {
  width: 8px;
  height: 22px;
  border: none;
  background: #0078d7;
}
.center-slide-enter-active,
.center-slide-leave-active {
  transition: transform 0.18s ease-out;
}
.center-slide-enter-from,
.center-slide-leave-to {
  transform: translateX(100%);
}
@media (prefers-reduced-motion: reduce) {
  .center-slide-enter-active,
  .center-slide-leave-active {
    transition: none;
  }
}
</style>
