<template>
  <div class="outer">
    <div class="detail-header">
      <span class="detail-label">{{ i18n('schedule.detail') }}</span>
    </div>
    <div class="detail-time">
      <span class="detail-date-text">{{ dateStr }}</span>
      <span class="detail-time-text">{{ timeStr }}</span>
    </div>
    <div v-if="entry.location" class="detail-location">{{ entry.location }}</div>
    <div class="detail-body">
      <label class="detail-content-label">{{ i18n('schedule.content') }}</label>
      <textarea
        class="detail-textarea"
        v-model="editText"
        rows="3"
      ></textarea>
    </div>
    <div class="detail-actions">
      <button class="btn-delete" @click="handleDelete">{{ i18n('schedule.delete') }}</button>
      <button class="btn-save" :disabled="!editText.trim() || editText === originalText" @click="handleSave">
        {{ i18n('schedule.save') }}
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, ref, computed } from 'vue';
import { BrowserWindow } from '@/packages/services';
import { System } from '@packages/kernel';
import { changeSchedule, type StoredEntry } from '../utils/schedule';
import { formatDesktopClock } from '../utils/desktopClock';
import { i18n } from '@/packages/computer/i18n';

const win = inject<BrowserWindow>('browserWindow')!;
const sys = inject<System>('system')!;

const entry: StoredEntry = win.config;
const originalText = ref(entry.text);
const editText = ref(originalText.value);
const preferences = computed(() => sys.getConfig('desktopPreferences'));
const display = computed(() => formatDesktopClock(new Date(entry.time), preferences.value));
const dateStr = computed(() => display.value.date);
const timeStr = computed(() => entry.endTime
  ? display.value.time + ' – ' + formatDesktopClock(new Date(entry.endTime), preferences.value).time
  : display.value.time);
async function handleSave() {
  const text = editText.value.trim();
  if (!text || text === originalText.value) return;
  try {
    await changeSchedule(sys, { ...entry, text: originalText.value }, text);
    originalText.value = text;
  } catch { sys.createNotify({title: i18n('schedule'), content: i18n('schedule.failed')}); }
}
async function handleDelete() {
  try {
    await changeSchedule(sys, { ...entry, text: originalText.value });
    win.close();
  } catch { sys.createNotify({title: i18n('schedule'), content: i18n('schedule.failed')}); }
}
</script>
<style lang="scss" scoped>
.outer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-ui-gray, #f5f5f5);
  box-sizing: border-box;
}

.detail-header {
  padding: 10px 16px 4px;

  .detail-label {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
  }
}

.detail-time {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 2px 16px 10px;
  border-bottom: 1px solid #e0e0e0;

  .detail-date-text {
    font-size: 16px;
    font-weight: 600;
    color: #1c1c1c;
  }

  .detail-time-text {
    font-size: 14px;
    color: #555;
  }
}

.detail-location { padding: 4px 16px; }
.detail-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px 16px;
  overflow: hidden;

  .detail-content-label {
    font-size: 11px;
    color: #888;
    margin-bottom: 4px;
  }

  .detail-textarea {
    flex: 1;
    resize: none;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 8px;
    font-size: 13px;
    font-family: inherit;
    color: #1c1c1c;
    background: #fff;
    outline: none;
    transition: border-color 0.15s;

    &:focus {
      border-color: var(--color-blue, #0078d7);
    }
  }
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 16px 12px;

  .btn-save,
  .btn-delete {
    padding: 5px 14px;
    font-size: 12px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .btn-save {
    background: var(--color-blue, #0078d7);
    color: #fff;

    &:hover:not(:disabled) {
      opacity: 0.85;
    }

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }

  .btn-delete {
    background: transparent;
    color: #c00;
    border: 1px solid #ccc;

    &:hover {
      background: #fde8e8;
      border-color: #c00;
    }
  }
}
</style>
