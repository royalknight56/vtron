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
          <span class="note-del" @click="deleteNote(note)">×</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject } from 'vue';
import { System } from '@packages/kernel';
import { join } from '@/packages/plug';
import { i18n } from '@/packages/computer/i18n';
import DateNote from '@/packages/computer/application/DateNote.vue';

const sys = inject<System>('system')!;

const recentNotes = ref<Array<{ text: string; time: number }>>([]);
const showForm = ref(false);

const now = new Date();
const formDate = ref(formatDateValue(now));
const formTime = ref(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
const formText = ref('');

function formatDateValue(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function schedulePath(date: Date) {
  const fileName = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.json`;
  return join(sys.stateManager.options.getOptions('userLocation') || '', '/Schedule', fileName);
}

function formatHourMin(timestamp: number) {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function dayLabel(timestamp: number): string {
  const d = new Date(timestamp);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);

  if (d.toDateString() === today.toDateString()) return i18n('schedule.today');
  if (d.toDateString() === tomorrow.toDateString()) return i18n('schedule.tomorrow');

  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const groupedNotes = computed(() => {
  const map = new Map<string, { label: string; items: { text: string; time: number }[] }>();
  for (const note of recentNotes.value) {
    const key = new Date(note.time).toDateString();
    if (!map.has(key)) {
      map.set(key, { label: dayLabel(note.time), items: [] });
    }
    map.get(key)!.items.push(note);
  }
  return Array.from(map.values());
});

async function loadRecentNotes() {
  const today = new Date();
  const notes: Array<{ text: string; time: number }> = [];

  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(today.getTime() + i * 86400000);
    try {
      const content = await sys.fs.readFile(schedulePath(checkDate));
      if (content) notes.push(...JSON.parse(content));
    } catch {
      continue;
    }
  }

  recentNotes.value = notes
    .filter((n) => n.time >= today.getTime() - 86400000)
    .sort((a, b) => a.time - b.time)
    .slice(0, 10);
}

async function addNote() {
  const text = formText.value.trim();
  if (!text) return;

  const [y, m, d] = formDate.value.split('-').map(Number);
  const [h, min] = formTime.value.split(':').map(Number);
  const noteDate = new Date(y, m - 1, d, h, min);
  const timestamp = noteDate.getTime();
  const filePath = schedulePath(noteDate);

  let existing: Array<{ text: string; time: number }> = [];
  try {
    const content = await sys.fs.readFile(filePath);
    if (content) existing = JSON.parse(content);
  } catch {
    // file doesn't exist yet
  }
  existing.push({ text, time: timestamp });

  const dirPath = join(sys.stateManager.options.getOptions('userLocation') || '', '/Schedule');
  if (!(await sys.fs.exists(dirPath))) {
    await sys.fs.mkdir(dirPath);
  }
  await sys.fs.writeFile(filePath, JSON.stringify(existing));

  formText.value = '';
  showForm.value = false;
  await loadRecentNotes();
}

async function deleteNote(note: { text: string; time: number }) {
  const noteDate = new Date(note.time);
  const filePath = schedulePath(noteDate);

  try {
    const content = await sys.fs.readFile(filePath);
    if (content) {
      let list: Array<{ text: string; time: number }> = JSON.parse(content);
      list = list.filter((n) => !(n.time === note.time && n.text === note.text));
      await sys.fs.writeFile(filePath, JSON.stringify(list));
    }
  } catch {
    // ignore
  }

  await loadRecentNotes();
  sys.emitEvent('schedule.change');
}

function openDetail(note: { text: string; time: number }) {
  const win = sys.createWindow({
    title: i18n('schedule.detail'),
    content: DateNote,
    config: { text: note.text, time: note.time },
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
