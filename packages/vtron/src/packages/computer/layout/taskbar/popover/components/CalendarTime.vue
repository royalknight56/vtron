<template>
    <div class="calendar">
        <div class="month">{{ currentMonth }}</div>
        <div class="date">{{ currentDate }}</div>
        <div class="day">{{ currentDay }}</div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { computed } from 'vue';

const now = ref(new Date());

const updateDate = () => {
    now.value = new Date();
};

let timer: number;

onMounted(() => {
    timer = window.setInterval(updateDate, 1000);
});

onUnmounted(() => {
    clearInterval(timer);
});

const currentMonth = computed(() => {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    return months[now.value.getMonth()];
});

const currentDate = computed(() => now.value.getDate());

const currentDay = computed(() => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[now.value.getDay()];
});
</script>

<style lang="scss" scoped>
.calendar {
    width: 110px;
    height: 110px;
    border-radius: 14px;
    background: var(--color-dark);
    position: relative;
    margin: 10px;
    box-shadow: 0 0 6px var(--color-dark);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--color-white);

    .month {
        font-size: 16px;
        margin-bottom: 4px;
    }

    .date {
        font-size: 32px;
        font-weight: bold;
        line-height: 1;
    }

    .day {
        font-size: 14px;
        margin-top: 4px;
    }
}
</style>
