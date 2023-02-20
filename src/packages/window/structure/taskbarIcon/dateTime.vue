<template>
    <div class="date_time">
        <div class="date_time_text">
            {{ date_time }}
            <br />
            {{ date_day }}
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';

// 设置时间日期
let date_day = ref('')
let date_time = ref('')
date_time.value = new Date().toLocaleTimeString()
date_day.value = new Date().toLocaleDateString()
setInterval(() => {
    let newDate = new Date()
    date_time.value = newDate.getHours().toString().padStart(2, '0') + ':' + newDate.getMinutes().toString().padStart(2, '0')
    date_day.value = new Date().toLocaleDateString()
}, 400)
</script>
<style scoped>
.date_time {
    /* justify-self: flex-end; */
    height: 100%;
}

.date_time_text {
    text-align: center;
    font-size: 12px;
    display: inline-block;
    transform: scale(0.8);
}

.date_time:hover {
    background-color: #e5eaf2;
}
</style>