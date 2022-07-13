<!--
 * @Author: Royal
 * @LastEditTime: 2022-05-29 16:30:20
 * @Description: 
-->
<template>
<div class="outer">
    <div  id="logoW">
        <div id="logo">
            <div class="win" id="win1"></div>
            <div class="win" id="win2"></div>
            <div class="win" id="win3"></div>
            <div class="win" id="win4"></div>
        </div>
    </div>
    <div id="text"></div>
</div>
    
</template>
<script lang="ts" setup>
</script>
<style scoped>
@import '../../../main.css';

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

</style>