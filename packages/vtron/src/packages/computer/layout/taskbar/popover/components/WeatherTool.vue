<template>
    <div class="weather">
        <div class="location">{{ location }}</div>
        <div class="temp">{{ temperature }}°C</div>
        <div class="weather-desc">{{ weatherDesc }}</div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const location = ref('正在定位...');
const temperature = ref('--');
const weatherDesc = ref('获取中...');

onMounted(async () => {
    try {
        // 获取地理位置
        const position = await new Promise((resolve, reject) => {
            // 获取权限
            
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        // const { latitude, longitude } = position.coords;

        // 这里使用示例天气 API,实际使用时需替换为真实的天气 API
        // const response = await fetch(
        //     `https://api.example.com/weather?lat=${latitude}&lon=${longitude}`
        // );
        // const data = await response.json();

        // location.value = '北京市'; // 示例数据
        // temperature.value = '25';  // 示例数据
        // weatherDesc.value = '晴'; // 示例数据

    } catch (error) {
        location.value = '定位失败';
        weatherDesc.value = '';
    }
});
</script>

<style lang="scss" scoped>
.weather {
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

    .location {
        font-size: 16px;
        margin-bottom: 4px;
    }

    .temp {
        font-size: 32px;
        font-weight: bold;
        line-height: 1;
    }

    .weather-desc {
        font-size: 14px;
        margin-top: 4px;
    }
}
</style>
