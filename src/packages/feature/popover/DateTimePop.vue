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
        <div class="day" v-for="item in weeks">
          <span>{{ item }}</span>
        </div>
      </div>
      <div class="month">
        <div class="week" v-for="week in month">
          <div class="day" v-for="day in week">
            <span>{{ day }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { mountEvent } from '../event';
let isDataPopShow = ref(false);
mountEvent('datetime.show', () => {
  isDataPopShow.value = true;
});
mountEvent('datetime.hidden', () => {
  isDataPopShow.value = false;
});
let timeDisplay = ref(`00:00:00`);
let dateDisplay = ref(`0000/00/00`);

setInterval(() => {
  let date = new Date();
  let time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  let dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  timeDisplay.value = time;
  dateDisplay.value = dateStr;
}, 500);

let weeks = ['日', '一', '二', '三', '四', '五', '六'];

let month = ref<Array<Array<string>>>([]);
let date = new Date();
let year = date.getFullYear();
let monthNum = date.getMonth() + 1;
let day = date.getDate();
let firstDay = new Date(year, monthNum - 1, 1).getDay();
let lastDay = new Date(year, monthNum, 0).getDate();
let weekNum = Math.ceil((firstDay + lastDay) / 7);
let week: Array<string> = [];
for (let i = 0; i < weekNum; i++) {
  month.value[i] = [];
  for (let j = 0; j < 7; j++) {
    month.value[i][j] = '';
  }
}
for (let i = 0; i < lastDay; i++) {
  month.value[Math.floor((firstDay + i) / 7)][(firstDay + i) % 7] = '' + (i + 1);
}
</script>
<style lang="scss" scoped>
.date-pop {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 300px;
  height: 500px;
  background-color: antiquewhite;
  border: 1px solid rgba(0, 0, 0, 0.19);
  .date-up {
    width: 100%;
    height: 70px;
    padding: 10px;
    background-color: #fff;
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
    padding: 10px;
    background-color: #fff;
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
    }
    .day:hover {
      background-color: #e6e6e6;
      user-select: none;
    }
  }
}
</style>
