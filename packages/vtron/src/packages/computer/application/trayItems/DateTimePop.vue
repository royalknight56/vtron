<template>
  <section class="calendar-panel" :aria-label="i18n('calendar.title')" @mousedown.stop>
    <header class="clock-header">
      <div class="clock-digits">{{ clock }}</div>
      <button class="date-link" @click="selectDay(today)">{{ fullDate.format(today) }}</button>
    </header>

    <section class="calendar">
      <div class="month-bar">
        <button class="month-title" :disabled="view === 'years'" @click="zoomOut">{{ heading }}</button>
        <button class="arrow-button" :aria-label="i18n('calendar.previous')" @click="navigate(-1)">
          <i class="chevron up"></i>
        </button>
        <button class="arrow-button" :aria-label="i18n('calendar.next')" @click="navigate(1)">
          <i class="chevron"></i>
        </button>
      </div>
      <template v-if="view === 'days'">
        <div class="weekdays">
          <span v-for="(label, i) in weekdays" :key="i">{{ label }}</span>
        </div>
        <div class="days">
          <button
            v-for="cell in days"
            :key="cell"
            class="cell"
            :class="{
              muted: new Date(cell).getUTCMonth() !== month,
              today: cell === today,
              selected: cell === selected,
            }"
            :aria-current="cell === today ? 'date' : undefined"
            :aria-pressed="cell === selected"
            :aria-label="fullDate.format(cell)"
            @click="selectDay(cell)"
          >
            {{ new Date(cell).getUTCDate() }}
          </button>
        </div>
      </template>
      <div v-else class="periods">
        <button
          v-for="period in periods"
          :key="period.value"
          class="cell"
          :class="{ today: period.current }"
          @click="selectPeriod(period.value)"
        >
          {{ period.label }}
        </button>
      </div>
    </section>

    <section v-if="agenda" class="agenda">
      <h2>
        {{ selected === today ? i18n('schedule.today') : weekdayName.format(selected)
        }}<span>{{ shortDate.format(selected) }}</span>
      </h2>
      <form @submit.prevent="save">
        <input
          v-model="text"
          class="event-input"
          :aria-label="i18n('calendar.newEvent')"
          :placeholder="i18n('calendar.newEvent')"
        />
        <template v-if="text || editing">
          <div class="times">
            <input type="time" v-model="start" required :aria-label="i18n('calendar.startTime')" />
            <span>–</span>
            <input type="time" v-model="end" :aria-label="i18n('calendar.endTime')" />
          </div>
          <input
            v-model="location"
            :aria-label="i18n('calendar.location')"
            :placeholder="i18n('calendar.location')"
          />
          <div class="actions">
            <button type="submit" :disabled="!text.trim() || saving">{{ i18n('schedule.save') }}</button>
            <button type="button" @click="resetForm">{{ i18n('cancel') }}</button>
          </div>
        </template>
      </form>
      <p v-if="error" role="alert" class="error">{{ error }}</p>
      <div class="events">
        <p v-if="!daily.length && !text && !error" class="empty">{{ i18n('schedule.no.selected') }}</p>
        <button v-for="(note, i) in daily" :key="note.id ?? i" class="event" @click="openDetail(note)">
          <span class="event-time"
            >{{ eventTime.format(note.time)
            }}<template v-if="note.endTime"> – {{ eventTime.format(note.endTime) }}</template></span
          >
          <span class="event-name"
            >{{ note.text }}<small v-if="note.location">{{ note.location }}</small></span
          >
        </button>
      </div>
    </section>
    <footer>
      <button class="date-link" :aria-expanded="agenda" @click="toggleAgenda">
        <i class="chevron" :class="{ up: !agenda }"></i
        >{{ i18n(agenda ? 'calendar.hideAgenda' : 'calendar.showAgenda') }}
      </button>
    </footer>
  </section>
</template>
<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import type { System } from '@packages/kernel';
import { i18n } from '../../i18n';
import { civilDay, dayMs, reminderInstant, wallClockFormatter, wallTime } from '../../utils/calendarTime';
import { formatDesktopClock } from '../../utils/desktopClock';
import { addSchedule, readSchedule, type StoredEntry } from '../../utils/schedule';
import DateNote from '../DateNote.vue';

const sys = inject<System>('system')!;
const preferences = computed(() => sys.getConfig('desktopPreferences'));
const locale = computed(() => preferences.value?.region || sys._options.lang || 'en-US');
const zone = computed(() => wallClockFormatter(preferences.value?.timeZone || undefined));
function dateFormatter(options: Intl.DateTimeFormatOptions) {
  return computed(() => new Intl.DateTimeFormat(locale.value, { timeZone: 'UTC', ...options }));
}
const fullDate = dateFormatter({ dateStyle: 'full' });
const shortDate = dateFormatter({ month: 'long', day: 'numeric' });
const weekdayName = dateFormatter({ weekday: 'long' });
const monthName = dateFormatter({ month: 'short' });
const monthYear = dateFormatter({ year: 'numeric', month: 'long' });
const eventTime = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: preferences.value?.timeZone || undefined,
    })
);
const now = ref(Date.now());
const clock = computed(() => formatDesktopClock(new Date(now.value), preferences.value, true).time);
const today = computed(() => civilDay(wallTime(now.value, zone.value)));
const selected = ref(today.value);
const cursor = ref(new Date(selected.value));
const year = computed(() => cursor.value.getUTCFullYear());
const month = computed(() => cursor.value.getUTCMonth());
const decade = computed(() => Math.floor(year.value / 10) * 10);
const view = ref<'days' | 'months' | 'years'>('days');
const heading = computed(() =>
  view.value === 'days'
    ? monthYear.value.format(cursor.value)
    : view.value === 'months'
      ? String(year.value)
      : decade.value + ' – ' + (decade.value + 9)
);
const firstWeekday = computed(() => (['zh-CN', 'en-GB'].includes(locale.value) ? 1 : 0));
const weekdays = computed(() => {
  const format = new Intl.DateTimeFormat(locale.value, {
    timeZone: 'UTC',
    weekday: locale.value.startsWith('zh') ? 'narrow' : 'short',
  });
  return Array.from({ length: 7 }, (_, i) => format.format(Date.UTC(2023, 0, 1 + firstWeekday.value + i)));
});
const days = computed(() => {
  const first = Date.UTC(year.value, month.value, 1);
  const offset = (new Date(first).getUTCDay() - firstWeekday.value + 7) % 7;
  return Array.from({ length: 42 }, (_, i) => first + (i - offset) * dayMs);
});
const periods = computed(() =>
  Array.from({ length: 12 }, (_, i) => {
    const day = new Date(today.value);
    if (view.value === 'months')
      return {
        value: i,
        label: monthName.value.format(Date.UTC(year.value, i, 1)),
        current: year.value === day.getUTCFullYear() && i === day.getUTCMonth(),
      };
    const value = decade.value + i - 1;
    return { value, label: String(value), current: value === day.getUTCFullYear() };
  })
);
function zoomOut() {
  view.value = view.value === 'days' ? 'months' : 'years';
}
function selectPeriod(value: number) {
  if (view.value === 'years') {
    cursor.value = new Date(Date.UTC(value, month.value, 1));
    view.value = 'months';
  } else {
    cursor.value = new Date(Date.UTC(year.value, value, 1));
    view.value = 'days';
  }
}
function navigate(step: number) {
  cursor.value = new Date(
    view.value === 'days'
      ? Date.UTC(year.value, month.value + step, 1)
      : Date.UTC(year.value + step * (view.value === 'months' ? 1 : 10), month.value, 1)
  );
}
function selectDay(day: number) {
  selected.value = day;
  cursor.value = new Date(day);
  view.value = 'days';
}
watch(today, (day, previous) => {
  if (selected.value === previous && view.value === 'days' && days.value.includes(previous)) selectDay(day);
});

const agenda = computed(() => preferences.value?.showCalendarAgenda !== false);
function toggleAgenda() {
  sys.setConfig('desktopPreferences', { ...preferences.value, showCalendarAgenda: !agenda.value });
}
const entries = ref<StoredEntry[]>([]);
const daily = computed(() =>
  entries.value.filter((n) => civilDay(wallTime(n.time, zone.value)) === selected.value)
);
const text = ref('');
const location = ref('');
const start = ref('');
const end = ref('');
const editing = ref(false);
const saving = ref(false);
const error = ref('');
watch(text, (value) => {
  if (value) editing.value = true;
});
function resetForm() {
  text.value = '';
  location.value = '';
  error.value = '';
  editing.value = false;
  const nextHour = new Date(wallTime(Date.now(), zone.value)).getUTCHours() + 1;
  const hour = selected.value === today.value ? Math.min(nextHour, 23) : 9;
  start.value = String(hour).padStart(2, '0') + ':00';
  end.value = hour < 23 ? String(hour + 1).padStart(2, '0') + ':00' : '';
}
watch(selected, resetForm, { immediate: true });
async function save() {
  if (saving.value || !text.value.trim()) return;
  const time = reminderInstant(selected.value, start.value, zone.value);
  const endTime = end.value ? reminderInstant(selected.value, end.value, zone.value) : undefined;
  if (!Number.isFinite(time) || (endTime !== undefined && !(endTime > time))) {
    error.value = i18n('calendar.invalidTime');
    return;
  }
  saving.value = true;
  try {
    await addSchedule(sys, {
      text: text.value.trim(),
      time,
      endTime,
      location: location.value.trim() || undefined,
    });
    resetForm();
  } catch {
    error.value = i18n('schedule.failed');
  } finally {
    saving.value = false;
  }
}
async function loadEntries() {
  try {
    entries.value = await readSchedule(sys);
  } catch {
    error.value = i18n('schedule.failed');
  }
}
function openDetail(note: StoredEntry) {
  sys.emitEvent('tray.hidden');
  sys
    .createWindow({
      title: i18n('schedule.detail'),
      content: DateNote,
      config: { ...note },
      width: 360,
      height: 280,
      center: true,
    })
    .show();
}
let timer: ReturnType<typeof setInterval>;
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
  sys.mountEvent('schedule.change', loadEntries);
  void loadEntries();
});
onUnmounted(() => {
  clearInterval(timer);
  sys.offEvent('schedule.change', loadEntries);
});
</script>
<style scoped lang="scss">
.calendar-panel {
  --accent: var(--color-blue, #0078d7);
  box-sizing: border-box;
  max-height: calc(100dvh - var(--task-bar-height));
  overflow-y: auto;
  background: rgba(246, 246, 246, 0.98);
  color: #1b1b1b;
  border: 1px solid #bdbdbd;
  box-shadow: 0 6px 22px #0003;
  font:
    14px/1.4 'Segoe UI',
    'Microsoft YaHei UI',
    sans-serif;
  user-select: none;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}
button,
input {
  box-sizing: border-box;
  color: inherit;
  font: inherit;
  border-radius: 0;
}
button {
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
}
button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -3px;
}
.clock-header {
  padding: 16px 24px 17px;
  border-bottom: 1px solid #0002;
}
.clock-digits {
  font-size: 42px;
  font-weight: 300;
  line-height: 1.23;
  font-variant-numeric: tabular-nums;
}
.date-link {
  color: #0067b8;
}
.date-link:hover {
  color: #222;
}
.calendar {
  padding: 8px 12px 12px;
}
.month-bar {
  display: flex;
  align-items: center;
  height: 38px;
}
.month-title {
  margin-right: auto;
  padding: 5px 11px;
  font-size: 15px;
}
.month-title:disabled {
  color: inherit;
  cursor: default;
}
.arrow-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 34px;
}
.arrow-button:hover,
.month-title:enabled:hover {
  background: #0001;
}
.chevron {
  display: inline-block;
  width: 9px;
  height: 9px;
  box-sizing: border-box;
  border: solid currentColor;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg) translate(-1px, -1px);
}
.chevron.up {
  transform: rotate(225deg) translate(-1px, -1px);
}
.weekdays,
.days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  text-align: center;
}
.weekdays {
  line-height: 34px;
  font-size: 13px;
}
.cell {
  height: 38px;
  margin: 1px;
  border: 2px solid transparent;
  font-variant-numeric: tabular-nums;
}
.cell.muted {
  color: #777;
}
.cell:hover {
  border-color: #aaa;
}
.cell.selected {
  border-color: var(--accent);
}
.cell.today {
  background: var(--accent);
  color: white;
}
.cell.today.selected {
  box-shadow: inset 0 0 0 1px white;
}
.periods {
  height: 274px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}
.periods .cell {
  height: auto;
}
.agenda {
  border-top: 1px solid #0002;
  padding: 14px 24px 0;
}
h2 {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 500;
}
h2 span {
  margin-left: 9px;
  font-size: 14px;
  font-weight: 400;
}
input {
  width: 100%;
  min-width: 0;
  height: 32px;
  padding: 4px 8px;
  border: 1px solid #888;
  background: white;
}
input:focus {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
.times,
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
}
.actions button {
  padding: 5px 15px;
  background: #ddd;
}
.actions button:first-child {
  background: var(--accent);
  color: white;
}
.actions button:disabled {
  opacity: 0.55;
}
.events {
  max-height: 150px;
  overflow-y: auto;
}
.empty {
  margin: 14px 0;
  color: #585858;
}
.event {
  display: flex;
  gap: 12px;
  align-items: baseline;
  width: 100%;
  margin: 8px 0;
  border-left: 3px solid var(--accent);
  padding: 4px 8px;
  text-align: left;
}
.event:hover {
  background: #0001;
}
.event-time {
  font-size: 12px;
  flex-shrink: 0;
}
.event-name {
  overflow-wrap: anywhere;
}
.event-name small {
  display: block;
  color: #555;
}
.error {
  color: #a4262c;
}
footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 24px 13px;
}
footer .date-link {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
