<template>
  <div class="clock">
    <div class="hour-hand" :style="hourRotation"></div>
    <div class="minute-hand" :style="minuteRotation"></div>
    <div class="second-hand" :style="secondRotation"></div>
    <div class="center-point"></div>
    <div class="time-marks">
      <div class="mark" v-for="n in 12" :key="n" :style="{ transform: `rotate(${n * 30}deg)` }">
        <div class="mark-line"></div>
      </div>
    </div>
    <div class="time-bg">

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { computed } from 'vue';

const now = ref(new Date());

const updateTime = () => {
  now.value = new Date();
};

let timer: number;

onMounted(() => {
  timer = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});

const hourRotation = computed(() => ({
  transform: `rotate(${(now.value.getHours() % 12) * 30 + now.value.getMinutes() / 2}deg)`
}));

const minuteRotation = computed(() => ({
  transform: `rotate(${now.value.getMinutes() * 6}deg)`
}));

const secondRotation = computed(() => ({
  transform: `rotate(${now.value.getSeconds() * 6}deg)`
}));
</script>

<style lang="scss" scoped>
.clock {
  width: 110px;
  height: 110px;
  border-radius: 14px;
  background: var(--color-dark);
  // border: 2px solid var(--color-blue);
  position: relative;
  margin: 10px;
  box-shadow: 0 0 6px var(--color-dark);

  .time-bg {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 90%;
    height: 90%;
    background: var(--color-white);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
  }

  .hour-hand,
  .minute-hand,
  .second-hand {
    z-index: 2;
    position: absolute;
    bottom: 50%;
    left: 50%;
    transform-origin: 50% 100%;
    background: var(--color-dark);
    box-shadow: 0 0 4px var(--color-dark);
  }

  .hour-hand {
    width: 4px;
    height: 25px;
    margin-left: -2px;
  }

  .minute-hand {
    width: 3px;
    height: 35px;
    margin-left: -1.5px;
  }

  .second-hand {
    width: 2px;
    height: 40px;
    margin-left: -1px;
    background: #ff0000;
  }

  .center-point {
    z-index: 2;
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    margin: -4px 0 0 -4px;
    background: var(--color-dark);
    border-radius: 50%;
  }

  .time-marks {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 2;

    .mark {
      position: absolute;
      width: 100%;
      height: 100%;

      .mark-line {
        position: absolute;
        top: 5px;
        left: 49%;
        width: 2px;
        height: 10px;
        background: var(--color-dark);
      }
    }
  }
}
</style>
