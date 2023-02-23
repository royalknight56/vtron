<template>
    <div id="wait">
        <div class="waitd" id="wait1"></div>
        <div class="waitd" id="wait2"></div>
        <div class="waitd" id="wait3"></div>
        <div class="waitd" id="wait4"></div>
    </div>
</template>
<script lang="ts" setup>
</script>
<style lang="scss" scoped>
#wait {
    position: absolute;
    left: 50%;
    top: calc(50% + 150px);
}

.waitd {
    position: absolute;
    width: 10px;
    height: 10px;
    left: 30px;
    background-color: azure;
    border-radius: 50%;
    transform-origin: -15px 0;
}

#wait1 {
    animation: dotAni1 2s linear infinite;
}

#wait2 {
    animation: dotAni2 2s linear infinite;
}

#wait3 {
    animation: dotAni3 2s linear infinite;
}

#wait4 {
    animation: dotAni4 2s linear infinite;
}

@keyframes dotAni1 {
    0% {
        transform: rotateZ(0deg);
    }

    20% {
        transform: rotateZ(240deg);
    }

    85% {
        transform: rotateZ(290deg);
    }

    100% {
        transform: rotateZ(360deg);
    }
}

@keyframes dotAni2 {
    0% {
        transform: rotateZ(0deg);
    }

    35% {
        transform: rotateZ(240deg);
    }

    85% {
        transform: rotateZ(290deg);
    }

    100% {
        transform: rotateZ(360deg);
    }
}

@keyframes dotAni3 {
    0% {
        transform: rotateZ(0deg);
    }

    50% {
        transform: rotateZ(240deg);
    }

    85% {
        transform: rotateZ(290deg);
    }

    100% {
        transform: rotateZ(360deg);
    }
}

@keyframes dotAni4 {
    0% {
        transform: rotateZ(0deg);
    }

    65% {
        transform: rotateZ(240deg);
    }

    85% {
        transform: rotateZ(290deg);
    }

    100% {
        transform: rotateZ(360deg);
    }
}
</style>