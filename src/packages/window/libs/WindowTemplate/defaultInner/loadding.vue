<template>
<div class="outer blueclass">
    <div id="text"></div>
    <div id="wait">
        <div class="waitd" id="wait1"></div>
        <div class="waitd" id="wait2"></div>
        <div class="waitd" id="wait3"></div>
        <div class="waitd" id="wait4"></div>
    </div>
</div>
</template>
<script lang="ts" setup>
</script>
<style scoped>
@import "@/packages/main.css";

img[src=""],img:not([src]) {
    display: none;
}
.outer{
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    /* z-index: -50; */
    background-color: rgb(0, 119, 210);
    user-select: none;
}
.blueclass{
    z-index: 10001;
    background-color: rgb(0, 119, 210);
    /* background-color: black; */
}
.blackclass{
    z-index: 10001;
    background-color: black;
}


* {
    transition: all 0.3s;
}

/* #mous{
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        z-index: 1;
        cursor: none; 
    } */
body {
    padding: 0;
    margin: 0;
    /* background-color: rgb(0, 119, 210); */
    /* cursor: none; */
    /* rgb(0, 120, 212); */
}

.win {
    width: 60px;
    height: 50px;
    background-color: azure;
    position: absolute;
}
/* .win:hover {
    background-color: rgb(181, 223, 252);
} */
#logoW {
    perspective: 150px;
    position: absolute;
    left: 50%;
    top: 50%;
    margin-left: -55px;
    margin-top: -55px;
}

#logo {
    width: 125px;
    height: 105px;
    transform: rotateY(-20deg);
}

/* #logo:hover {
    transform: rotateY(0deg);
} */

#win1 {
    left: 0;
    top: 0;
}

#win2 {
    left: 0;
    bottom: 0;
}

#win3 {
    right: 0;
    top: 0;
}

#win4 {
    right: 0;
    bottom: 0;
}

#text {
    display: inline-block;
    position: absolute;
    width: 100%;
    text-align: center;
    top: 80%;
    color: azure;
    font-weight: 500;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

#wait {
    position: absolute;
    left: 50%;
    top: 50%;
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

#dot {
    position: relative;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: aliceblue;
    text-align: center;
    font-weight: 700;
    color: rgb(0, 119, 210);
    cursor: pointer;
}
#dot::selection {
    cursor: none;
}

#dot:hover {
    font-weight: 900;
}
#dottext {
    position: absolute;
    top: 0;
    width: 400px;
    opacity: 0;
    transition: all 0.1s;
}
#dot:hover #dottext {
    display: block;
    color: aliceblue;
    opacity: 1;
    font-weight: 400;
}
</style>