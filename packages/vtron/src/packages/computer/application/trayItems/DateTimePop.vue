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
        <div class="day" v-for="item in weeksPrefix" :key="item">
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
        <input type="text" placeholder="添加日程或提醒" v-model="alertText" /><br />
        <!-- 时 -->
        <input type="number" :max="24" :min="0" v-model="alertHour" @blur="checkAlert()" /> 时
        <!-- 分 -->
        <input type="number" :max="60" :min="0" v-model="alertMin" @blur="checkAlert()" /> 分
        <WinButtonVue @click="addAlert">确定</WinButtonVue>
      </div>
      <div class="exist-sch">
        <div class="no-sch" v-if="alertList.length <= 0">今日无日程</div>
        <div class="sch-item" v-for="(item, index) in alertList" :key="item.text" @click="clickDetail(item)">
          <span class="sch-time"
            >{{ new Date(item.time).getHours() }}时{{ new Date(item.time).getMinutes() }}分：</span
          >
          <span class="sch-text">{{ item.text }}</span>

          <WinButtonVue @click.stop="deleteAlert(index)">删除</WinButtonVue>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, onMounted, onUnmounted, reactive, ref } from 'vue';
import { System } from '@packages/kernel';
import { WinButtonVue, join } from '@/packages/plug';

import DateNote from '@/packages/computer/application/DateNote.vue';
import { vGlowing } from '@/packages/computer/utils/glowingBorder';
import { initAlertEvent } from '../../mount/initEventListener';

const sys = inject<System>('system')!;
const timeDisplay = ref(`00:00:00`);
const dateDisplay = ref(`0000/00/00`);
const weeksPrefix = ['日', '一', '二', '三', '四', '五', '六'];
const month = ref<Array<Array<string>>>([]);
const date = new Date();
const mFirstDay = new Date(date.getFullYear(), date.getMonth(), 1);

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

// 选择日期
function onDayClick(weekIndex: number, dayIndex: number) {
  if (month.value[weekIndex][dayIndex] === '') {
    return;
  }
  chosen.weekIndex = weekIndex;
  chosen.dayIndex = dayIndex;
  readDateNotes();
}
function updateTime() {
  const date = new Date();
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  const dateStr = `${today.year}/${today.month}/${today.day}`;
  timeDisplay.value = time;
  dateDisplay.value = dateStr;
}
const firstDay = new Date(today.year, today.month - 1, 1).getDay();
const lastDay = new Date(today.year, today.month, 0).getDate();
const weekNum = Math.ceil((firstDay + lastDay) / 7);
let timer: any = null;
onMounted(() => {
  timer = setInterval(() => {
    updateTime();
  }, 500);
  updateTime();

  for (let i = 0; i < weekNum; i++) {
    month.value[i] = [];
    for (let j = 0; j < 7; j++) {
      month.value[i][j] = '';
    }
  }
  for (let i = 0; i < lastDay; i++) {
    month.value[Math.floor((firstDay + i) / 7)][(firstDay + i) % 7] = `${i + 1}`;
  }
  readDateNotes();
});
onUnmounted(() => {
  clearInterval(timer);
});

function pad(num: number) {
  return num.toString().padStart(2, '0');
}

const alertText = ref('');
const alertHour = ref(0);
const alertMin = ref(0);
function checkAlert() {
  if (alertHour.value > 24) {
    alertHour.value = 24;
  }
  if (alertHour.value < 0) {
    alertHour.value = 0;
  }
  if (alertMin.value > 60) {
    alertMin.value = 60;
  }
  if (alertMin.value < 0) {
    alertMin.value = 0;
  }
}
// 添加日程
async function addAlert() {
  if (alertText.value === '') {
    return;
  }
  const chosenDay = new Date(
    today.year,
    today.month - 1,
    parseInt(month.value[chosen.weekIndex][chosen.dayIndex]),
    alertHour.value,
    alertMin.value
  );
  const fileName = `${chosenDay.getFullYear()}-${chosenDay.getMonth() + 1}-${chosenDay.getDate()}.json`;
  const alredyNotes = await sys.fs.readFile(
    join(sys.stateManager.options.getOptions('userLocation') || '', '/Schedule', fileName)
  );
  if (alredyNotes) {
    const notes = JSON.parse(alredyNotes);
    notes.push({
      text: alertText.value,
      time: chosenDay.getTime(),
    });
    await sys.fs.writeFile(
      join(sys.stateManager.options.getOptions('userLocation') || '', '/Schedule', fileName),
      JSON.stringify(notes)
    );
  } else {
    const notes = [
      {
        text: alertText.value,
        time: chosenDay.getTime(),
      },
    ];
    await sys.fs.writeFile(
      join(sys.stateManager.options.getOptions('userLocation') || '', '/Schedule', fileName),
      JSON.stringify(notes)
    );
  }
  initAlertEvent(sys);
  alertText.value = '';
  alertHour.value = 0;
  alertMin.value = 0;
  readDateNotes();
}

async function deleteAlert(index: number) {
  const chosenDay = new Date(
    today.year,
    today.month - 1,
    parseInt(month.value[chosen.weekIndex][chosen.dayIndex]),
    alertHour.value,
    alertMin.value
  );
  const fileName = `${chosenDay.getFullYear()}-${chosenDay.getMonth() + 1}-${chosenDay.getDate()}.json`;
  const alredyNotes = await sys.fs.readFile(
    join(sys.stateManager.options.getOptions('userLocation') || '', '/Schedule', fileName)
  );
  if (alredyNotes) {
    const notes = JSON.parse(alredyNotes);
    notes.splice(index, 1);
    if (notes.length === 0) {
      await sys.fs.unlink(
        join(sys.stateManager.options.getOptions('userLocation') || '', '/Schedule', fileName)
      );
    } else {
      await sys.fs.writeFile(
        join(sys.stateManager.options.getOptions('userLocation') || '', '/Schedule', fileName),
        JSON.stringify(notes)
      );
    }
  }
  readDateNotes();
}

const alertList = ref<
  Array<{
    text: string;
    time: number;
  }>
>([]);
async function readDateNotes() {
  const chosenDay = new Date(
    today.year,
    today.month - 1,
    parseInt(month.value[chosen.weekIndex][chosen.dayIndex]),
    alertHour.value,
    alertMin.value
  );
  const fileName = `${chosenDay.getFullYear()}-${chosenDay.getMonth() + 1}-${chosenDay.getDate()}.json`;
  const alredyNotes = await sys.fs.readFile(
    join(sys.stateManager.options.getOptions('userLocation') || '', '/Schedule', fileName)
  );
  if (alredyNotes) {
    alertList.value = JSON.parse(alredyNotes);
  } else {
    alertList.value = [];
  }
}
const win = sys.createWindow({
  title: '日程详情',
  content: DateNote,
  width: 300,
  height: 200,
});
/** 点击日程，打开详情 */
function clickDetail(item: { text: string; time: number }) {
  const chosenDay = new Date(
    today.year,
    today.month - 1,
    parseInt(month.value[chosen.weekIndex][chosen.dayIndex])
  );
  win.config = {
    text: item.text,
    day: chosenDay,
    time: item.time,
  };
  win.show();
}
</script>
<style lang="scss" scoped>
.date-pop {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 320px;
  height: 600px;
  background-color: var(--color-gray-dark-op9);
  border: 1px solid rgba(0, 0, 0, 0.19);
  user-select: none;
  box-sizing: border-box;
  z-index: 100;
  .date-up {
    width: 100%;
    height: 70px;
    padding: 20px;
    margin-bottom: 20px;
    box-sizing: border-box;
    .date-time {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      .time {
        font-size: 30px;
        font-weight: 300;
      }
      .date {
        font-size: 12px;
        font-weight: 400;
      }
    }
  }
  .date-middle {
    height: min-content;
    padding-top: 10px;
    padding: 10px 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.19);
    .week {
      width: 100%;
      height: 24px;
      display: flex;
      margin: 1px 0px;
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
      // height: 390px;
      display: flex;
      flex-direction: column;
      .week {
        width: 100%;
        height: 42px;
        display: flex;
        .day {
          // width: 14.28%;
          // height: 100%;
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
          // background-color: #e6e6e6;
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
      }
    }
  }
  .date-note {
    border: 1px solid rgba(0, 0, 0, 0.19);
  }
  .date-bottom {
    margin-top: 10px;
    // padding: 0 10px;
    .add-sch {
      padding-left: 10px;
    }
    .exist-sch {
      height: 130px;
      overflow-y: auto;
      margin-top: 10px;
      .no-sch {
        padding-top: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sch-item {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding: 4px;
        padding-left: 10px;

        .sch-text {
          font-size: 12px;
          font-weight: 400;
          padding-right: 20px;
          width: 90px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sch-time {
          font-size: 12px;
          font-weight: 200;
          padding-right: 2px;
          width: 68px;
        }
      }
      .sch-item::after {
        position: absolute;
        left: 0;
        content: '';
        display: block;
        width: 4px;
        height: 80%;
        background-color: rgb(0, 115, 255);
        transition: all 0.1s;
      }

      .sch-item:hover {
        background-color: var(--color-gray-op9);
      }
      .sch-item:hover::after {
        height: 100%;
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
