<!--
 * @Author: Royal
 * @LastEditTime: 2022-03-03 10:52:22
 * @Description: 
-->
<template>
    <div class="bottom_button">
        <slot></slot>
    </div>
</template>

<style scoped>
.bottom_button {
    width: 80px;
    height: 26px;
    line-height: 26px;
    text-align: center;
    font-size: 13px;
    background-color: #e1e1e1;
    border: 1px solid #999999;
    transition: all 0.2s;
    box-sizing: border-box;
    margin: 0 0 0 10px;
}
.bottom_button:first-child {
    border: 1px solid #0078d7;
    box-shadow: 0 0 0px 1px #0078d7 inset;
}
.bottom_button:hover {
    border: 1px solid #0078d7;
    background-color: #e5f1fb;
    box-shadow: 0 0 0 0px #0078d7 inset;
}
</style>