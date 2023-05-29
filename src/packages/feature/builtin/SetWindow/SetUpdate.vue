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
                    <h1 class="setting-title">系统备份与导入</h1>
                </div>
                <div class="setting-item">
                    <label>导出系统状态</label>
                    <WinButton @click="handleClick(0)">导出配置</WinButton>
                </div>
                <div class="setting-item">
                    <label>导入状态文件</label>
                    <textarea v-model="inputConfig" type="text"></textarea>
                </div>
                <div class="setting-item">
                    <label></label>
                    <WinButton @click="handleClick(1)">导入配置</WinButton>
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
    '备份',
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
const inputConfig = ref('')
const selectItem = (index: number) => {
    activeIndex.value = index;
};

async function handleClick(num: number) {
    if (num === 0) {//导出配置
        let cfg = await system?.serializeState();
        try {
            await navigator.clipboard.writeText(cfg!);
            Dialog.showMessageBox({
                title: '导出配置',
                message: '导出成功,已保存到粘贴板',
                type: 'info',
                buttons: ['确定']
            })
        } catch (err) {
            Dialog.showMessageBox({
                title: '导出配置',
                message: '导出失败',
                type: 'error',
                buttons: ['确定']
            })
        }

    } else if (num === 1) {
        // 导入配置
        try {
            let req = await Dialog.showMessageBox({
                title: '导入配置',
                message: '导入会覆盖现有的文件,是否继续?',
                type: 'warning',
                buttons: ['确定','取消']
            });
            if(req.response === 1) return;
            await system?.deserializeState(inputConfig.value);
            setTimeout(() => {
                system?.reboot();
            }, 10000);
            await Dialog.showMessageBox({
                title: '导入成功',
                message: '即将重启电脑',
                type: 'warning',
                buttons: ['确定']
            });
            system?.reboot();
        } catch (err) {
            Dialog.showMessageBox({
                title: '导入配置',
                message: '导入失败',
                type: 'error',
                buttons: ['确定']
            })
        }
    }
}
getRemoteVersion()
function getRemoteVersion() {

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
    text-align: right;

}
</style>