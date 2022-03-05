<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-03-04 15:44:17
 * @Description: 
-->
<template>
    <div class="outer">
        <div class="uper_tab">
            <div class="tab">
                Windows 设置
            </div>
        </div>
        <div class="outer_main">
            <div class="main_uper">
                <WinSelect :options="[{
                    value:'1',
                    label:'1231'
                },
                {
                    value:'2',
                    label:'2'
                },
                ]"
                v-model="testselect"
                ></WinSelect>
                
                <!-- <img draggable="false" class="app_icon" :src="windowInfo.props.icon" />
                <div class="app_name">{{ windowInfo.props.name }}</div> -->
            </div>
        </div>
        <div class="bottom">
            <div @click="closeWindow" class="bottom_button">
                 确定
            </div>
            <div @click="closeWindow" class="bottom_button">
                 取消
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>

import { inject, ref } from 'vue';
import { DWM } from '../libs/DWM';
import WinSelect from './winComponent/WinSelect.vue'
let id =<string>inject('windowId')

let windowInfo = DWM.getInstance().getWindow(id )
function closeWindow(){
    DWM.getInstance().destoryWindow(id )
}
let testselect = ref('2')
</script>

<style scoped>
@import '../../main.css';
.outer {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    /* background-color: #f0f0f0; */
    user-select: none;
    background-color: rgb(241, 241, 241);

}
.outer_main {
    height: 100%;
    /* width: 100%; */
    background-color: white;
    border: 1px solid #d9d9d9;
    margin: 0px 10px 00px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.main_uper {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    height: 50px;
    width: 90%;

    border-bottom: 1px solid #999999;
}
.main_card {
    font-size: 12px;
    line-height: 30px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    height: 80px;
    width: 90%;
    border-bottom: 1px solid #999999;
}
.app_icon {
    width: 30px;
    height: 30px;
    margin: 6px;
    margin-right: 18px;
    user-select: none;
}
.app_info {
    width: 300px;
}
.app_info td {
    width: 100px;
}
.app_name {
}
.uper_tab{
    /* width: 90%; */
    margin: 10px 10px -1px 10px;
    font-size: 12px;

    z-index: 1;
    display: flex;
}
.tab{
    text-align: center;
    width: 40px;
    background-color: #fff;
    
    border: 1px solid #d9d9d9;
    border-bottom:none;
}
.tab_unactive{
    text-align: center;
    width: 40px;
    background-color: rgb(241, 241, 241);
    
    border: 1px solid #d9d9d9;
    /* border-bottom:none; */
}
.bottom {
    flex-shrink: 0;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    flex-shrink: 0;
    width: 90%;
    margin: 6px auto;
    background-color: #f0f0f0;
}
.bottom_button{
    width:80px;
    height:26px;
    line-height: 26px;
    text-align: center;
    font-size: 13px;
    background-color: #e1e1e1;
    border: 1px solid #999999;
    transition: all 0.2s;
    box-sizing: border-box;
    margin: 0 0 0 10px;
}
.bottom_button:first-child{
    border: 1px solid #0078d7;
    box-shadow: 0 0 0px 1px #0078d7 inset;
}
.bottom_button:hover{
    border: 1px solid #0078d7;
    background-color: #e5f1fb;
    box-shadow: 0 0 0 0px #0078d7 inset;
}

</style>