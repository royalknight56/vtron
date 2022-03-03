<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-03-03 14:16:27
 * @Description: 
-->
<template>
    <!-- <div class="checkbox_button">
    </div>-->
    <div class="checkbox_group">
        <input type="checkbox" id="inputId" class="checkbox_button" />
        <label class="checkbox_text" for="inputId">
            <slot></slot>
        </label>
    </div>
</template>

<style scoped>
input {
    display: none;
}
label {
    display: inline-block;
    width: 20px;
    height: 20px;
    border-radius: 5px;
    border: 1px solid #2eb5f0;
    position: relative;
    cursor: pointer;
}
label::before {
    display: inline-block;
    content: " ";
    width: 12px;
    border: 2px solid #fff;
    height: 4px;
    border-top: none;
    border-right: none;
    transform: rotate(-45deg);
    top: 5px;
    left: 3px;
    position: absolute;
    opacity: 0;
}
input:checked + label {
    background: #2eb5f0;
}
input:checked + label::before {
    opacity: 1;
    transform: all 0.5s;
}


/* .checkbox_group {
    display: flex;
    align-items: center;
} */
/* .checkbox_button {
    width: 20px;
    height: 20px;
    background-color: #e1e1e1;
    border: 1px solid #999999;
    transition: all 0.2s;
    box-sizing: border-box;
}
.checkbox_text {
    line-height: 20px;
    font-size: 13px;
    text-align: center;
}
.checkbox_button:first-child {
    border: 1px solid #0078d7;
    box-shadow: 0 0 0px 1px #0078d7 inset;
}
.checkbox_button:hover {
    border: 1px solid #0078d7;
    background-color: #e5f1fb;
    box-shadow: 0 0 0 0px #0078d7 inset;
} */
</style>