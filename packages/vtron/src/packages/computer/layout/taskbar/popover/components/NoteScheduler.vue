<template>
  <div class="note-scheduler">
    <div class="header">
      <span class="title">{{ i18n('schedule') }}</span>
      <span class="add-btn" @click="showForm = !showForm">{{ showForm ? '×' : '+' }}</span>
    </div>

    <Transition name="slide">
      <div v-if="showForm" class="add-form">
        <div class="form-row">
          <input type="date" v-model="formDate" class="form-input date-input" />
          <input type="time" v-model="formTime" class="form-input time-input" />
        </div>
        <div class="form-row">
          <input
            class="form-input text-input"
            v-model="formText"
            :placeholder="i18n('schedule.placeholder')"
            @keydown.enter="addNote"
          />
          <button class="form-btn" @click="addNote" :disabled="!formText.trim()">
            {{ i18n('schedule.add') }}
          </button>
        </div>
      </div>
    </Transition>

    <div v-if="recentNotes.length === 0" class="empty">{{ i18n('schedule.empty') }}</div>
    <div v-else class="notes-list scroll-bar">
      <template v-for="(group, gi) in groupedNotes" :key="gi">
        <div class="group-label">{{ group.label }}</div>
        <div
          v-for="(note, ni) in group.items"
          :key="ni"
          class="note-item"
          @click="openDetail(note)"
        >
          <div class="note-dot"></div>
          <div class="note-body">
            <div class="note-time">{{ formatHourMin(note.time) }}</div>
            <div class="note-text">{{ note.text }}</div>
          </div>
          <span class="note-del" @click.stop="deleteNote(note)">×</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject } from 'vue';
import { System } from '@packages/kernel';
import { addSchedule, changeSchedule, readSchedule, type StoredEntry } from '../../../../utils/schedule';
import { civilDay, dayMs, reminderInstant, wallClockFormatter, wallTime } from '../../../../utils/calendarTime';
import { formatDesktopClock } from '../../../../utils/desktopClock';
import { i18n } from '@/packages/computer/i18n';
import DateNote from '@/packages/computer/application/DateNote.vue';

const sys = inject<System>('system')!;

const entries = ref<StoredEntry[]>([]);
const preferences = computed(() => sys.getConfig('desktopPreferences'));
const zone = computed(() => wallClockFormatter(preferences.value?.timeZone || undefined));
const now = Date.now();
const today = computed(() => civilDay(wallTime(now, zone.value)));
const recentNotes = computed(() => entries.value.filter(note => {
  const day = civilDay(wallTime(note.time, zone.value));
  return day >= today.value && day < today.value + 7 * dayMs;
}).slice(0, 10));
const showForm = ref(false);
const formDate = ref(new Date(today.value).toISOString().slice(0, 10));
const formTime = ref(new Date(wallTime(now, zone.value)).toISOString().slice(11, 16));
const formText = ref('');

function formatHourMin(time: number) {
  return formatDesktopClock(new Date(time), preferences.value).time;
}
const groupedNotes = computed(() => {
  const groups = new Map<number, { label: string; items: StoredEntry[] }>();
  for (const note of recentNotes.value) {
    const day = civilDay(wallTime(note.time, zone.value));
    const label = day === today.value ? i18n('schedule.today') : day === today.value + dayMs
      ? i18n('schedule.tomorrow') : formatDesktopClock(new Date(note.time), preferences.value).date;
    if (!groups.has(day)) groups.set(day, { label, items: [] });
    groups.get(day)!.items.push(note);
  }
  return Array.from(groups.values());
});
async function loadRecentNotes() {
  try { entries.value = await readSchedule(sys); }
  catch { reportError(); }
}
function reportError() {
  sys.createNotify({ title: i18n('schedule'), content: i18n('schedule.failed') });
}
async function addNote() {
  const text = formText.value.trim();
  if (!text) return;

  const day = Date.parse(formDate.value);
  if (!Number.isFinite(day)) return;
  const timestamp = reminderInstant(day, formTime.value, zone.value);
  if (!Number.isFinite(timestamp)) return;
  try { await addSchedule(sys, { text, time: timestamp }); }
  catch { reportError(); return; }

  formText.value = '';
  showForm.value = false;
}

async function deleteNote(note: StoredEntry) {
  try { await changeSchedule(sys, note); } catch { reportError(); }
}

function openDetail(note: StoredEntry) {
  const win = sys.createWindow({
    title: i18n('schedule.detail'),
    content: DateNote,
    config: { ...note },
    width: 320,
    height: 260,
    center: true,
    resizable: false,
  });
  win.show();
}

function onScheduleChange() {
  loadRecentNotes();
}

onMounted(() => {
  loadRecentNotes();
  sys.mountEvent('schedule.change', onScheduleChange);
});

onUnmounted(() => {
  sys.offEvent('schedule.change', onScheduleChange);
});
</script>

<style lang="scss" scoped>
@import '@packages/assets/main.scss';

.note-scheduler {
  width: 100%;
  border-radius: 6px;
  background: var(--color-ui-gray, #f3f3f3);
  border: var(--border-gray, 1px solid #e0e0e0);
  padding: 10px 12px;
  box-sizing: border-box;
  color: var(--color-dark, #222);

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;

    .title {
      font-size: 13px;
      font-weight: 600;
    }

    .add-btn {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      user-select: none;
      transition: background 0.15s;

      &:hover {
        background: rgba(0, 0, 0, 0.08);
      }
    }
  }

  .add-form {
    margin-bottom: 8px;
    overflow: hidden;

    .form-row {
      display: flex;
      gap: 6px;
      margin-bottom: 6px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .form-input {
      font-size: 12px;
      padding: 4px 6px;
      border: 1px solid #ccc;
      border-radius: 4px;
      outline: none;
      background: #fff;
      color: inherit;
      font-family: inherit;

      &:focus {
        border-color: var(--color-blue, #0078d7);
      }
    }

    .date-input {
      flex: 1;
    }

    .time-input {
      width: 80px;
    }

    .text-input {
      flex: 1;
    }

    .form-btn {
      padding: 4px 10px;
      font-size: 12px;
      border: none;
      border-radius: 4px;
      background: var(--color-blue, #0078d7);
      color: #fff;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.15s;

      &:hover:not(:disabled) {
        opacity: 0.85;
      }

      &:disabled {
        opacity: 0.4;
        cursor: default;
      }
    }
  }

  .empty {
    font-size: 12px;
    color: #999;
    text-align: center;
    padding: 16px 0;
  }

  .notes-list {
    max-height: 180px;
    overflow-y: auto;

    .group-label {
      font-size: 11px;
      font-weight: 600;
      color: #888;
      margin: 6px 0 2px;
      text-transform: uppercase;

      &:first-child {
        margin-top: 0;
      }
    }

    .note-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 4px 6px;
      border-radius: 4px;
      cursor: pointer;
      position: relative;
      transition: background 0.12s;

      &:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      .note-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--color-blue, #0078d7);
        flex-shrink: 0;
        margin-top: 5px;
      }

      .note-body {
        flex: 1;
        min-width: 0;

        .note-time {
          font-size: 11px;
          color: #888;
        }

        .note-text {
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .note-del {
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        border-radius: 3px;
        cursor: pointer;
        opacity: 0;
        flex-shrink: 0;
        transition: opacity 0.15s, background 0.15s;
        color: #888;

        &:hover {
          background: rgba(0, 0, 0, 0.08);
          color: #d00;
        }
      }

      &:hover .note-del {
        opacity: 1;
      }
    }
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 80px;
  margin-bottom: 8px;
}
</style>
