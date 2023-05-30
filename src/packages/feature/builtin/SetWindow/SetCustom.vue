<template>
    <div class="container">
        <div class="nav">
            <ul>
                <li v-for="(item, index) in items" :key="index" @click="selectItem(index)"
                    :class="{ active: index === activeIndex }">{{ item }}</li>
            </ul>
        </div>
        <div class="setting">
            <div v-if="0 === activeIndex">
                <div class="setting-item">
                    <h1 class="setting-title">背景</h1>
                </div>
                <div class="setting-item">
                    <label>设置背景图片</label>
                    <WinSelect v-model="imgtype"
                    :options="[
                        {
                            label:'来源网络',
                            value:0
                        },
                        {
                            label:'来源字符串',
                            value:1
                        }
                    ]"
                     placeholder="请选择">
                    </WinSelect>
                </div>
                <div class="setting-item">
                    <label></label>
                    <WinInput
                    placeholder=""
                     v-model="imgurl"></WinInput>
                </div>
                
                <div class="setting-item">
                    <label></label>
                    <WinButton @click="submit">确认</WinButton>
                </div>
            </div>
            <div v-if="1 === activeIndex">
                <div class="setting-item">
                    <h1 class="setting-title">系统版本</h1>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import WinButton from '@/packages/components/WinButton.vue';
import WinSelect from '@/packages/components/WinSelect.vue';
import WinInput from '@/packages/components/WinInput.vue';


import { defineComponent, ref } from 'vue';
import { useSystem } from "@packages/feature/system"
import {Dialog} from '@/packages/feature/dialog/Dialog';

interface Field {
    name: string;
    label: string;
    type: string;
    placeholder: string;
}
let system = useSystem()
const items = [
    '背景',
    // '版本',
]
const fields: Field[] = [
    {
        name: 'name',
        label: 'Name',
        type: 'text',
        placeholder: 'Enter your name'
    },
    {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter your email'
    },
    {
        name: 'password',
        label: 'Password',
        type: 'password',
        placeholder: 'Enter your password'
    }
]
const activeIndex = ref(0);
const formData = ref({});
const inputConfig = ref('');
const imgtype = ref(0)
const imgurl = ref('');

const selectItem = (index: number) => {
    activeIndex.value = index;
};

function submit(){

}
</script>
  
<style scoped>
.container {
    display: flex;
    flex-direction: row;
    height: 100%;
    user-select: none;
}

.nav {
    width: 200px;
    background-color: #f0f0f0;
    /* padding: 20px; */
}

.nav ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

.nav li {
    cursor: pointer;
    padding: 10px 20px;
}

.nav li.active {
    background-color: #ccc;
}

.setting {
    flex: 1;
    padding: 20px;
    width: 100%;
}

.setting-title {
    font-size: 24px;
    font-weight: 300;
    margin-bottom: 20px;
    display: flex;
    justify-content: flex-start;
    width: 100%;
}

.setting-item {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    margin-bottom: 20px;
    gap: 20px;
}

.setting-item label {
    display: block;
    width: 100px;
    flex-shrink: 0;
    text-align: right;

}
</style>