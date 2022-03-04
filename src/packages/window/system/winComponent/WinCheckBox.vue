<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-03-04 14:11:50
 * @Description: 
-->
<template>
    <!-- <div class="checkbox_button">
    </div>-->
    <span class="checkbox_group">
        <input type="checkbox" id="inputId" class="checkbox_button" />
        <label class="checkbox_label" for="inputId">
        </label>
        <span class="checkbox_text">
            <slot></slot>
        </span>
        
    </span>
</template>

<style scoped>
.checkbox_group{
    /* display: flex; */
    /* display: inline-block; */
    vertical-align:top;
    height: 30px;
    line-height: 30px;
    /* text-align: center; */
    /* align-items: center; */
}
.checkbox_label{
    vertical-align:middle;
    margin-right: 3px;
}
.checkbox_text{
    vertical-align:middle;
    
}
input {
    display: none;
}
label {
    display: inline-block;
    width: 14px;
    height: 14px;
    /* border-radius: 5px; */
    border: 1px solid #303030;
    position: relative;
    cursor: pointer;
    transition: all 0.2s;
}
label:hover{
    border: 1px solid #2eb5f0;
    background: #2eb6f018;
}
label::before {
    display: inline-block;
    content: " ";
    width: 12px;
    border: 3px solid #000;
    
    height: 4px;
    border-top: none;
    border-right: none;
    transform: rotate(-45deg);
    top: 3px;
    left: 0px;
    position: absolute;
    opacity: 0;
}
input:checked + label {
    background: rgba(46, 182, 240, 0);
}
input:checked + label::before {
    opacity: 1;
    /* transform: all 0.5s; */
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