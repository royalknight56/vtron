<template>
  <div v-if="isDataPopShow" class="date-pop" @mousedown.stop="">
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
            }"
            v-for="(perday, dayIndex) in perweek"
            :key="perday"
            @click="onDayClick(weekIndex, dayIndex)"
          >
            <span>{{ perday }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { mountEvent } from '@feature/event';
const isDataPopShow = ref(false);
mountEvent('datetime.show', () => {
  isDataPopShow.value = true;
});
mountEvent('datetime.hidden', () => {
  isDataPopShow.value = false;
});
const timeDisplay = ref(`00:00:00`);
const dateDisplay = ref(`0000/00/00`);
const weeksPrefix = ['一', '二', '三', '四', '五', '六', '日'];
const month = ref<Array<Array<string>>>([]);
const date = new Date();
const today = {
  weekIndex: Math.floor((date.getDay() + date.getDate()) / 7),
  dayIndex: (date.getDay() + date.getDate()) % 7,
  day: date.getDate(),
  month: date.getMonth() + 1,
  year: date.getFullYear(),
};
const chosen = reactive({
  weekIndex: today.weekIndex,
  dayIndex: today.dayIndex,
});
function onDayClick(weekIndex: number, dayIndex: number) {
  chosen.weekIndex = weekIndex;
  chosen.dayIndex = dayIndex;
}
function updateTime() {
  const date = new Date();
  const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  const dateStr = `${today.year}/${today.month}/${today.day}`;
  timeDisplay.value = time;
  dateDisplay.value = dateStr;
}
const firstDay = new Date(today.year, today.month - 1, 1).getDay();
const lastDay = new Date(today.year, today.month, 0).getDate();
const weekNum = Math.ceil((firstDay + lastDay) / 7);
setInterval(() => {
  updateTime();
}, 500);
onMounted(() => {
  updateTime();
});
for (let i = 0; i < weekNum; i++) {
  month.value[i] = [];
  for (let j = 0; j < 7; j++) {
    month.value[i][j] = '';
  }
}
for (let i = 0; i < lastDay; i++) {
  month.value[Math.floor((firstDay + i - 1) / 7)][(firstDay + i - 1) % 7] = `${i + 1}`;
}
</script>
<style lang="scss" scoped>
.date-pop {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 300px;
  height: 500px;
  background-color: var(--color-gray);
  border: 1px solid rgba(0, 0, 0, 0.19);
  .date-up {
    width: 100%;
    height: 70px;
    padding: 10px;
    margin-bottom: 10px;
    box-sizing: border-box;
    .date-time {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      .time {
        font-size: 30px;
        font-weight: 100;
      }
      .date {
        font-size: 18px;
        font-weight: 100;
      }
    }
  }
  .date-middle {
    width: 100%;
    height: 430px;
    padding-top: 10px;
    border-top: 1px solid rgba(0, 0, 0, 0.19);
    .week {
      width: 100%;
      height: 30px;
      display: flex;
      .day {
        width: 14.28%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        span {
          font-size: 12px;
          font-weight: 100;
        }
      }
    }
    .month {
      width: 100%;
      height: 390px;
      display: flex;
      flex-direction: column;
      .week {
        width: 100%;
        height: 56px;
        display: flex;
        .day {
          // width: 14.28%;
          // height: 100%;
          height: var(--task-bar-height);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid transparent;
          span {
            font-size: 12px;
            font-weight: 100;
          }
        }
        .day:hover {
          // background-color: #e6e6e6;
          user-select: none;
          border: 3px solid var(--color-gray-active);
        }
        .istoday {
          background-color: var(--color-gray-active);
        }
        .chosen {
          border: 3px solid var(--color-dark);
        }
        .chosen:hover {
          border: 3px solid var(--color-dark-hover);
        }
      }
    }
  }
}
</style>
