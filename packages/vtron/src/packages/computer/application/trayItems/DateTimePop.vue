<template>
  <div class="date-pop" @mousedown.stop="">
    <div class="date-up">
      <div class="date-time">
        <span class="time">{{ timeDisplay }}</span>
        <span class="date">{{ dateDisplay }}</span>
      </div>
    </div>
    <div class="date-middle">
      <div class="week">
        <div class="day" v-for="item in weekLabels" :key="item">
          <span>{{ item }}</span>
        </div>
      </div>
      <div class="month">
        <div class="week" v-for="(perweek, weekIndex) in month" :key="perweek[0]">
          <div
            class="day"
            :class="{
              istoday: today.weekIndex === weekIndex && today.dayIndex === dayIndex,
              chosen: chosen.weekIndex === weekIndex && chosen.dayIndex === dayIndex,
              invday: perday === '',
              haveNote: noteMap[weekIndex]?.[dayIndex],
            }"
            v-glowing
            v-for="(perday, dayIndex) in perweek"
            :key="perday"
            @click="onDayClick(weekIndex, dayIndex)"
          >
            <span>{{ perday }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="date-bottom">
      <div class="add-sch">
        <div class="add-header">
          <span class="add-label">{{ chosenDateLabel }}</span>
        </div>
        <div class="add-form">
          <input
            class="add-input"
            type="text"
            :placeholder="i18n('schedule.placeholder')"
            v-model="alertText"
            @keydown.enter="addAlert"
          />
          <input class="add-time" type="time" v-model="alertTimeStr" />
          <button class="add-btn" @click="addAlert" :disabled="!alertText.trim()">
            {{ i18n('schedule.add') }}
          </button>
        </div>
      </div>
      <div class="exist-sch scroll-bar">
        <div class="no-sch" v-if="alertList.length <= 0">{{ i18n('schedule.no.selected') }}</div>
        <div class="sch-item" v-for="(item, index) in alertList" :key="index" @click="clickDetail(item)">
          <div class="sch-bar"></div>
          <div class="sch-body">
            <span class="sch-time">{{ formatNoteTime(item.time) }}</span>
            <span class="sch-text">{{ item.text }}</span>
          </div>
          <span class="sch-del" @click.stop="deleteAlert(index)">×</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, onMounted, onUnmounted, reactive, ref, computed } from 'vue';
import { System } from '@packages/kernel';
import { join } from '@/packages/plug';
import { i18n } from '@/packages/computer/i18n';

import DateNote from '@/packages/computer/application/DateNote.vue';
import { vGlowing } from '@/packages/computer/utils/glowingBorder';
import { initAlertEvent } from '../../mount/initEventListener';

const sys = inject<System>('system')!;
const timeDisplay = ref('00:00:00');
const dateDisplay = ref('0000/00/00');
const weekLabels = computed(() => [
  i18n('week.sun'),
  i18n('week.mon'),
  i18n('week.tue'),
  i18n('week.wed'),
  i18n('week.thu'),
  i18n('week.fri'),
  i18n('week.sat'),
]);
const month = ref<Array<Array<string>>>([]);
const date = new Date();
const mFirstDay = new Date(date.getFullYear(), date.getMonth(), 1);
const noteMap = reactive<{ [key: number]: { [key: number]: boolean } }>({});

const today = {
  weekIndex: Math.floor((mFirstDay.getDay() + date.getDate() - 1) / 7),
  dayIndex: date.getDay(),
  day: date.getDate(),
  month: date.getMonth() + 1,
  year: date.getFullYear(),
};
const chosen = reactive({
  weekIndex: today.weekIndex,
  dayIndex: today.dayIndex,
});

const chosenDateLabel = computed(() => {
  const dayStr = month.value[chosen.weekIndex]?.[chosen.dayIndex] || '';
  return `${i18n('schedule.add.to')} ${today.year}/${today.month}/${dayStr}`;
});

function onDayClick(weekIndex: number, dayIndex: number) {
  if (month.value[weekIndex][dayIndex] === '') return;
  chosen.weekIndex = weekIndex;
  chosen.dayIndex = dayIndex;
  readDateNotes();
}

function updateTime() {
  const d = new Date();
  timeDisplay.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  dateDisplay.value = `${today.year}/${today.month}/${today.day}`;
}

const firstDay = new Date(today.year, today.month - 1, 1).getDay();
const lastDay = new Date(today.year, today.month, 0).getDate();
const weekNum = Math.ceil((firstDay + lastDay) / 7);
let timer: any = null;

onMounted(() => {
  timer = setInterval(updateTime, 500);
  updateTime();
  sys.mountEvent('schedule.change', onScheduleChange);

  for (let i = 0; i < weekNum; i++) {
    month.value[i] = [];
    for (let j = 0; j < 7; j++) {
      month.value[i][j] = '';
    }
  }
  for (let i = 0; i < lastDay; i++) {
    const wi = Math.floor((firstDay + i) / 7);
    const di = (firstDay + i) % 7;
    month.value[wi][di] = `${i + 1}`;
    readDateNotesAtDay(new Date(today.year, today.month - 1, i + 1)).then((notes) => {
      if (notes.length > 0) {
        noteMap[wi] = { ...noteMap[wi], [di]: true };
      }
    });
  }
  readDateNotes();
});

onUnmounted(() => {
  clearInterval(timer);
  sys.offEvent('schedule.change', onScheduleChange);
});

function pad(num: number) {
  return num.toString().padStart(2, '0');
}

function formatNoteTime(timestamp: number) {
  const d = new Date(timestamp);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function schedulePath(d: Date) {
  return join(
    sys.stateManager.options.getOptions('userLocation') || '',
    '/Schedule',
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}.json`
  );
}

function getChosenDate(hour = 0, minute = 0) {
  return new Date(
    today.year,
    today.month - 1,
    parseInt(month.value[chosen.weekIndex][chosen.dayIndex]),
    hour,
    minute
  );
}

const alertText = ref('');
const alertTimeStr = ref('09:00');

async function addAlert() {
  if (!alertText.value.trim()) return;
  const [h, m] = alertTimeStr.value.split(':').map(Number);
  const chosenDay = getChosenDate(h, m);
  const filePath = schedulePath(chosenDay);

  let notes: Array<{ text: string; time: number }> = [];
  try {
    const content = await sys.fs.readFile(filePath);
    if (content) notes = JSON.parse(content);
  } catch {
    // file doesn't exist
  }

  notes.push({ text: alertText.value, time: chosenDay.getTime() });
  await sys.fs.writeFile(filePath, JSON.stringify(notes));

  initAlertEvent(sys);
  alertText.value = '';

  noteMap[chosen.weekIndex] = { ...noteMap[chosen.weekIndex], [chosen.dayIndex]: true };
  readDateNotes();
  sys.emitEvent('schedule.change');
}

async function deleteAlert(index: number) {
  const chosenDay = getChosenDate();
  const filePath = schedulePath(chosenDay);

  try {
    const content = await sys.fs.readFile(filePath);
    if (content) {
      const notes: Array<{ text: string; time: number }> = JSON.parse(content);
      notes.splice(index, 1);
      if (notes.length === 0) {
        await sys.fs.unlink(filePath);
        noteMap[chosen.weekIndex] = { ...noteMap[chosen.weekIndex], [chosen.dayIndex]: false };
      } else {
        await sys.fs.writeFile(filePath, JSON.stringify(notes));
      }
    }
  } catch {
    // ignore
  }
  readDateNotes();
  sys.emitEvent('schedule.change');
}

const alertList = ref<Array<{ text: string; time: number }>>([]);

async function readDateNotes() {
  alertList.value = await readDateNotesAtDay(getChosenDate());
}

async function readDateNotesAtDay(d: Date) {
  try {
    const content = await sys.fs.readFile(schedulePath(d));
    if (content) return JSON.parse(content);
  } catch {
    // ignore
  }
  return [];
}

function clickDetail(item: { text: string; time: number }) {
  const win = sys.createWindow({
    title: i18n('schedule.detail'),
    content: DateNote,
    config: { text: item.text, time: item.time },
    width: 320,
    height: 260,
    center: true,
    resizable: false,
  });
  win.show();
}

function refreshNoteMap() {
  for (let i = 0; i < lastDay; i++) {
    const wi = Math.floor((firstDay + i) / 7);
    const di = (firstDay + i) % 7;
    readDateNotesAtDay(new Date(today.year, today.month - 1, i + 1)).then((notes) => {
      noteMap[wi] = { ...noteMap[wi], [di]: notes.length > 0 };
    });
  }
}

function onScheduleChange() {
  readDateNotes();
  refreshNoteMap();
}
</script>
<style lang="scss" scoped>
.date-pop {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 320px;
  height: 600px;
  background-color: #ededed;
  border: 1px solid #9c9c9c;
  user-select: none;
  box-sizing: border-box;
  z-index: 100;
  display: flex;
  flex-direction: column;

  .date-up {
    width: 100%;
    padding: 16px 20px;
    box-sizing: border-box;

    .date-time {
      display: flex;
      flex-direction: column;

      .time {
        font-size: 30px;
        font-weight: 300;
      }

      .date {
        font-size: 12px;
        font-weight: 400;
        margin-top: 2px;
      }
    }
  }

  .date-middle {
    padding: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.12);

    .week {
      width: 100%;
      height: 24px;
      display: flex;
      margin: 1px 0;

      .day {
        position: relative;
        width: 14.28%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        span {
          font-size: 12px;
          font-weight: 500;
        }
      }
    }

    .month {
      width: 100%;
      display: flex;
      flex-direction: column;

      .week {
        height: 40px;

        .day {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid transparent;
          transition: all 0.1s;
          box-sizing: border-box;

          span {
            font-size: 12px;
            font-weight: 400;
          }
        }

        .day:hover {
          user-select: none;
          border: 3px solid var(--color-gray-active);
        }

        .invday:hover {
          border: 3px solid transparent;
        }

        .istoday {
          background-color: var(--color-gray-op9);
        }

        .istoday.chosen {
          box-shadow: inset 0 0 0px 3px var(--color-dark-hover);
          border: 3px solid white;
        }

        .istoday.chosen:hover {
          border: 3px solid var(--color-gray-active);
        }

        .chosen {
          border: 3px solid rgba(77, 77, 77, 0.7);
        }

        .chosen:hover {
          border: 3px solid var(--color-dark-hover);
        }

        .haveNote {
          background-color: rgba(106, 194, 253, 0.167);
        }
      }
    }
  }

  .date-bottom {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-top: 1px solid rgba(0, 0, 0, 0.12);

    .add-sch {
      padding: 8px 12px;

      .add-header {
        margin-bottom: 6px;

        .add-label {
          font-size: 12px;
          color: #666;
        }
      }

      .add-form {
        display: flex;
        gap: 6px;
        align-items: center;

        .add-input {
          flex: 1;
          font-size: 12px;
          padding: 5px 8px;
          border: 1px solid #ccc;
          border-radius: 3px;
          outline: none;
          background: #fff;
          font-family: inherit;

          &:focus {
            border-color: var(--color-blue, #0078d7);
          }
        }

        .add-time {
          width: 80px;
          font-size: 12px;
          padding: 4px 4px;
          border: 1px solid #ccc;
          border-radius: 3px;
          outline: none;
          background: #fff;
          font-family: inherit;

          &:focus {
            border-color: var(--color-blue, #0078d7);
          }
        }

        .add-btn {
          padding: 5px 10px;
          font-size: 12px;
          border: none;
          border-radius: 3px;
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
    }

    .exist-sch {
      flex: 1;
      overflow-y: auto;
      padding: 0 4px 8px;

      .no-sch {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px 0;
        font-size: 12px;
        color: #999;
      }

      .sch-item {
        position: relative;
        display: flex;
        align-items: center;
        padding: 6px 8px;
        margin: 2px 0;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.12s;

        &:hover {
          background-color: var(--color-gray-op9);
        }

        .sch-bar {
          width: 3px;
          height: 100%;
          min-height: 28px;
          border-radius: 2px;
          background: var(--color-blue, #0078d7);
          flex-shrink: 0;
          margin-right: 8px;
          transition: background 0.12s;
        }

        .sch-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;

          .sch-time {
            font-size: 11px;
            color: #888;
          }

          .sch-text {
            font-size: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        .sch-del {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          border-radius: 3px;
          flex-shrink: 0;
          opacity: 0;
          cursor: pointer;
          color: #888;
          transition: opacity 0.12s, background 0.12s;

          &:hover {
            background: rgba(0, 0, 0, 0.08);
            color: #d00;
          }
        }

        &:hover .sch-del {
          opacity: 1;
        }
      }
    }
  }
}

.fade-enter-active {
  transition: all 0.4s var(--aniline);
}

.fade-leave-active {
  transition: all 0.2s;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0px);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
