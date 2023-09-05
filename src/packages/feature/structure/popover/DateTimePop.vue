<template>
  <Transition name="fade">
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
  </Transition>
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
function onDayClick(weekIndex: number, dayIndex: number) {
  chosen.weekIndex = weekIndex;
  chosen.dayIndex = dayIndex;
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

onMounted(() => {
  setInterval(() => {
    updateTime();
  }, 500);
  updateTime();
});
for (let i = 0; i < weekNum; i++) {
  month.value[i] = [];
  for (let j = 0; j < 7; j++) {
    month.value[i][j] = '';
  }
}
for (let i = 0; i < lastDay; i++) {
  month.value[Math.floor((firstDay + i) / 7)][(firstDay + i) % 7] = `${i + 1}`;
}

function pad(num: number) {
  return num.toString().padStart(2, '0');
}
</script>
<style lang="scss" scoped>
.date-pop {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 320px;
  height: 500px;
  background-color: var(--color-gray-dark);
  border: 1px solid rgba(0, 0, 0, 0.19);
  user-select: none;
  box-sizing: border-box;
  z-index: 100;
  .date-up {
    width: 100%;
    height: 90px;
    padding: 20px;
    margin-bottom: 20px;
    box-sizing: border-box;
    .date-time {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      .time {
        font-size: 40px;
        font-weight: 300;
      }
      .date {
        font-size: 14px;
        font-weight: 400;
      }
    }
  }
  .date-middle {
    height: 430px;
    padding-top: 10px;
    padding: 10px 8px;
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
          font-weight: 500;
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
          transition: all 0.1s;
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
        .istoday {
          background-color: var(--color-gray-op9);
        }
        .istoday.chosen {
          box-shadow: inset 0 0 0px 3px var(--color-dark);
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
