<template>
  <div class="history">
    <p v-if="!groups.size" class="empty">{{ i18n('no.message') }}</p>
    <section v-for="[source, notes] in groups" :key="source" :aria-label="source">
      <div class="source">
        <span class="SEGOEUIMDL" aria-hidden="true">{{ sourceIcon(source) }}</span>
        <h2>{{ source }}</h2>
        <button
          type="button"
          class="dismiss"
          :aria-label="i18n('center.clearGroup') + ' · ' + source"
          :title="i18n('center.clearGroup')"
          @click="notes.forEach((note) => note.close())"
        >
          &#xE711;
        </button>
      </div>
      <article v-for="note in notes" :key="note.id" class="card">
        <component :is="note._onClickFn ? 'button' : 'div'" class="body" @click="activate(note)">
          <strong>{{ note.title }}</strong>
          <span class="content">{{ note.content }}</span>
          <time :datetime="new Date(note.createdAt).toISOString()">{{ timestamp(note.createdAt) }}</time>
        </component>
        <button
          type="button"
          class="dismiss"
          :aria-label="i18n('center.dismiss') + ' · ' + note.title"
          :title="i18n('center.dismiss')"
          @click="note.close()"
        >
          &#xE711;
        </button>
      </article>
    </section>
  </div>
  <button v-if="groups.size" type="button" class="clear-all" @click="state.clear()">
    {{ i18n('center.clear') }}
  </button>
</template>
<script setup lang="ts">
import { computed, inject } from 'vue';
import type { System } from '@packages/kernel';
import type { Notify } from '@/packages/services';
import { i18n } from '../../../../i18n';
import { formatDesktopClock } from '../../../../utils/desktopClock';

const sys = inject<System>('system')!;
const state = sys.stateManager.notify;
const groups = computed(() => {
  const bySource = new Map<string, Notify[]>();
  for (const note of state.history) {
    if (!bySource.has(note.source)) bySource.set(note.source, []);
    bySource.get(note.source)!.push(note);
  }
  return bySource;
});
function timestamp(value: number) {
  const prefs = sys.getConfig('desktopPreferences');
  const { date, time } = formatDesktopClock(new Date(value), prefs);
  return date === formatDesktopClock(new Date(), prefs).date ? time : date + ' ' + time;
}
function sourceIcon(source: string) {
  if (source === '设置') return '\uE713';
  if (source === i18n('schedule')) return '\uE787';
  if (source === '闹钟和时钟') return '\uE823';
  return '\uE7E7';
}
function activate(note: Notify) {
  if (!note._onClickFn) return;
  state.setOpen(false);
  note.close();
  note._onClickFn();
}
</script>
<style scoped>
.history {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 0 8px 8px;
  scrollbar-width: thin;
}
.empty {
  margin: auto;
  color: #555;
}
.source {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 8px 6px;
}
.source > span {
  font-size: 16px;
}
h2 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  flex: 1;
}
button {
  font: inherit;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.card {
  position: relative;
  margin: 2px 0;
  background: rgba(255, 255, 255, 0.78);
}
.card:hover,
.card:focus-within {
  box-shadow: inset 0 0 0 1px #0003;
}
.body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: 11px 32px 10px 12px;
  box-sizing: border-box;
  text-align: left;
  overflow-wrap: anywhere;
}
strong {
  font-weight: 600;
}
.content {
  white-space: pre-wrap;
}
time {
  margin-top: 6px;
  font-size: 12px;
  color: #5c5c5c;
}
.dismiss {
  padding: 5px;
  opacity: 0;
  font: 12px/1 'SEGOEUIMDL';
}
.card > .dismiss {
  position: absolute;
  top: 6px;
  right: 6px;
}
.card:hover .dismiss,
.source:hover .dismiss,
.dismiss:focus-visible {
  opacity: 1;
}
.dismiss:hover {
  background: #0001;
}
.clear-all {
  flex: none;
  margin-right: 8px;
  align-self: flex-end;
  padding: 8px;
  color: #0067b8;
  font-size: 13px;
}
.clear-all:hover {
  color: #222;
}
@media (hover: none) {
  .dismiss {
    opacity: 1;
  }
}
</style>
