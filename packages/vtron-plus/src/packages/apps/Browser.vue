<!--
 * @Author: Royal
 * @LastEditTime: 2022-03-03 10:02:43
 * @Description: 这是个未完成的浏览器窗口
-->
<template>
  <div class="up-handle" v-dragable>
    <div class="tab-group">
      <div
        class="up-tab"
        :class="{
          active: currentTab === '主页',
        }"
        @click="switchTab('主页')"
      >
        <div class="tab">主页</div>
      </div>
      <div
        class="up-tab"
        :class="{
          active: currentTab === item,
        }"
        v-for="(item, index) in tabs"
        :key="item"
        @click="switchTab(item)"
      >
        <div class="tab">{{ item }}</div>
        <div class="close" @click.stop="removeTab(item)">-</div>
      </div>
      <div class="up-tab-add" @click="addTab()">+</div>
    </div>
    <div class="up-button-group">
      <WinUpButtonGroupVue :browser-window="browserWindow"></WinUpButtonGroupVue>
    </div>
  </div>
  <BrowserTab :key="'主页'" v-show="currentTab === '主页'" :isCurrent="currentTab === '主页'"></BrowserTab>
  <BrowserTab
    v-for="item in tabs"
    v-show="currentTab === item"
    :key="item"
    :isCurrent="currentTab === item"
  ></BrowserTab>
</template>
<script lang="ts" setup>
import { inject, onUnmounted, ref } from 'vue';
import { BrowserWindow, vDragable, WinUpButtonGroupVue } from 'vtron';
import BrowserTab from './Browser/BrowserTab.vue';
const browserWindow = inject<BrowserWindow>('browserWindow')!;
const tabs = ref<string[]>([]);
const currentTab = ref<string>('主页');
const tabCount = ref(0);
const addTab = () => {
  const tab = '新标签' + tabCount.value++;
  tabs.value.push(tab);
  currentTab.value = tab;
};
const removeTab = (tab: string) => {
  const index = tabs.value.indexOf(tab);
  if (index !== -1) {
    tabs.value.splice(index, 1);
    if (currentTab.value === tab) {
      currentTab.value = tabs.value[index - 1] || '主页';
      console.log('remove', currentTab.value);
    }
  }
};
const switchTab = (tab: string) => {
  currentTab.value = tab;
};
</script>

<style scoped>
.up-handle {
  display: flex;
  /* overflow: hidden; */
  width: 100%;
  height: 30px;
  background-color: aliceblue;
  /* border: 1px solid #bebebe; */
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  user-select: none;
}
.tab-group {
  display: flex;
  flex: 1;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  height: 100%;
  padding-left: 10px;
  overflow: hidden;
}
.up-button-group {
  width: 100px;
}
.up-tab {
  margin-left: 2px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100px;
  height: 20px;
  align-self: flex-end;
  background-color: #f5f5f5;
  border: 1px solid #bebebe;
  border-radius: 8px 8px 0 0;
  padding: 0px 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 20px;
  box-sizing: border-box;
}
.up-tab.active {
  background-color: #ffffff;
  border-bottom: none;
}
.tab {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.close {
  margin-left: 5px;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 14px;
  height: 14px;
  align-self: flex-end;
  background-color: #ffffff;
  border: 1px solid #bebebe;
  border-radius: 8px;
  flex-shrink: 0;
}
.close:hover {
  background-color: #ff0000;
  color: #ffffff;
}
.up-tab-add {
  margin-left: 10px;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  align-self: flex-end;
  background-color: #ffffff;
  border: 1px solid #bebebe;
  border-radius: 8px 8px 0 0;
  border-bottom: none;
  flex-shrink: 0;
}
</style>
