<!--
 * @Author: Royal
 * @LastEditTime: 2022-03-03 10:02:43
 * @Description: 这是个未完成的浏览器窗口
-->
<template>
  <div class="up-handle" v-dragable @dblclick="handleDbclick">
    <div class="tab-group">
      <!-- <div
        class="up-tab tab-setting"
        :class="{
          active: currentTab === '设置',
        }"
        @click="switchTab('设置')"
      >
        <div class="tab">设置</div>
      </div> -->
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
        <div class="close" @click.stop="removeTab(item)">
          <svg viewBox="0 0 1024 1024">
            <path
              d="M566.97558594 521.09667969L856.8828125 231.18945312c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355468l-1.58203125-1.58203125c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0L512 466.51660156 222.09277344 176.21386719c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0l-1.58203125 1.58203125c-15.02929688 14.63378906-15.02929688 38.75976563 0 53.39355469l289.90722656 289.90722656L167.1171875 811.00390625c-14.63378906 14.63378906-14.63378906 38.75976563 0 53.39355469l1.58203125 1.58203125c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0L512 576.07226563 801.90722656 865.97949219c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0l1.58203125-1.58203125c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355469L566.97558594 521.09667969z"
            ></path>
          </svg>
        </div>
      </div>
      <div class="up-tab-add" @click="addTab()">+</div>
    </div>
    <div class="up-button-group">
      <WinUpButtonGroupVue :browser-window="browserWindow"></WinUpButtonGroupVue>
    </div>
  </div>
  <div :key="'设置'" v-show="currentTab === '设置'" :isCurrent="currentTab === '设置'" class="setting-tab">
    <h3>主页设置</h3>
    <input type="text" />
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
const handleDbclick = () => {
  if (browserWindow.isMaximized()) {
    browserWindow.unmaximize();
  } else {
    browserWindow.maximize();
  }
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
.tab-setting {
  width: 50px;
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
  /* background-color: #ffffff; */
  /** border: 1px solid #bebebe; **/
  border-radius: 8px;
  flex-shrink: 0;
}
.close svg {
  width: 10px;
  height: 10px;
}
.close:hover {
  background-color: #5757577f;
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

.setting-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  user-select: none;
  background-color: #ffffff;
}
</style>
